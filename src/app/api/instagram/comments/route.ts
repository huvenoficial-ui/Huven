import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { anthropic } from '@/lib/anthropic'

export const maxDuration = 60

async function igPost(endpoint: string, body: object) {
  const res = await fetch(`https://instagram120.p.rapidapi.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
      'x-rapidapi-host': 'instagram120.p.rapidapi.com',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

    const handle = username.replace('@', '')

    // Fetch recent posts
    const postsData = await igPost('/api/instagram/posts', { username: handle })
    const edges = postsData?.result?.edges || []
    const posts = edges.map((e: any) => e.node).filter(Boolean).slice(0, 5)

    if (posts.length === 0) {
      return NextResponse.json({ imported: 0, message: 'Nenhum post encontrado' })
    }

    // Fetch real comments from each post
    const rawComments: { handle: string; text: string; post: string }[] = []

    for (const post of posts) {
      const shortcode = post.shortcode || post.code
      if (!shortcode) continue

      const caption = post.caption?.text?.slice(0, 60) || 'post sem legenda'

      try {
        const commentsData = await igPost('/api/instagram/comments', { shortcode })
        const commentEdges =
          commentsData?.result?.edges ||
          commentsData?.data?.shortcode_media?.edge_media_to_comment?.edges ||
          commentsData?.comments?.edges ||
          []

        for (const edge of commentEdges.slice(0, 15)) {
          const node = edge.node || edge
          const text = node.text || node.comment_text
          const owner = node.owner?.username || node.username || node.user?.username
          if (text && owner) {
            rawComments.push({ handle: '@' + owner, text, post: caption })
          }
        }
      } catch {
        // skip posts where comments can't be fetched
      }
    }

    if (rawComments.length === 0) {
      return NextResponse.json({
        imported: 0,
        message: 'Não foi possível obter comentários reais desta conta. Verifica se o perfil é público e tem comentários visíveis.',
      })
    }

    // Use Claude to classify the REAL comments (not generate fake ones)
    const commentsList = rawComments
      .slice(0, 30)
      .map((c, i) => `${i + 1}. ${c.handle}: "${c.text}" [post: "${c.post}"]`)
      .join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Classifica estes comentários reais do Instagram de @${handle} (nicho: vendas/negócios para empresários brasileiros).

Comentários reais:
${commentsList}

Para cada comentário, classifica em:
- lead: interesse em comprar, perguntar sobre produto/serviço, pedir preço
- objection: ceticismo, dúvida, crítica
- engagement: elogio, partilha, interação positiva sem intenção de compra

Retorna APENAS JSON válido:
{"comments":[{"index":1,"category":"lead|objection|engagement","score":7.5}]}

Score 0-10 (10 = lead mais quente, mais propenso a comprar).
Retorna uma entrada por comentário recebido, na mesma ordem.`,
      }],
    })

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')
      .replace(/```json|```/g, '')
      .trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ imported: 0, error: 'Erro ao classificar comentários' })

    const { comments: classified } = JSON.parse(match[0])
    if (!classified?.length) return NextResponse.json({ imported: 0 })

    // Build lead rows combining real comment data with AI classification
    const rows = classified.map((c: any) => {
      const original = rawComments[c.index - 1]
      if (!original) return null
      return {
        handle: original.handle,
        text: original.text,
        score: c.score || 5,
        stage: c.category === 'lead' ? 'novo' : c.category === 'objection' ? 'contato' : 'novo',
        post: original.post || null,
        notes: '',
        tags: [],
        reply: null,
        follow_up_date: null,
      }
    }).filter(Boolean)

    if (rows.length > 0) {
      await supabaseAdmin.from('leads').insert(rows)
    }

    return NextResponse.json({ imported: rows.length, real: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
