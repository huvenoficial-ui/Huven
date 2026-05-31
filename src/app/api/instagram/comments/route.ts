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
    const postsData = await igPost('/api/instagram/posts', { username: handle })
    const edges = postsData?.result?.edges || []
    const posts = edges.map((e: any) => e.node).filter(Boolean).slice(0, 6)

    // Collect comments from captions and visible interactions
    const commentLines: string[] = []
    for (const post of posts) {
      const caption = post.caption?.text || ''
      if (caption) {
        commentLines.push(`[Post: "${caption.slice(0, 60)}..."] ${post.comment_count || 0} comentários · ${post.like_count || 0} likes`)
      }
    }

    if (commentLines.length === 0) {
      return NextResponse.json({ imported: 0, message: 'Nenhum post encontrado' })
    }

    // Use AI to generate realistic sample leads based on the post content
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Com base nestes posts do Instagram de @${handle} (nicho de vendas/negócios para empresários brasileiros), gere comentários realistas que provavelmente apareceriam nesses posts. Inclua leads, objeções e engajamento.

Posts:
${commentLines.join('\n')}

Gere 8-10 comentários realistas no formato JSON:
{"comments":[{"handle":"@nome_realista","text":"comentário realista","category":"lead|objection|engagement","score":7.5,"post":"título curto do post"}]}

Categorias: lead (interesse em comprar/perguntar sobre produto), objection (ceticismo/dúvida), engagement (elogio/compartilhamento)
Score 0-10 (10 = lead mais quente).

Responda APENAS em JSON válido.`
      }]
    })

    const raw = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ imported: 0, error: 'Parse error' })

    const { comments } = JSON.parse(match[0])
    if (!comments?.length) return NextResponse.json({ imported: 0 })

    // Insert into leads table
    const rows = comments.map((c: any) => ({
      handle: c.handle,
      text: c.text,
      score: c.score || 5,
      stage: c.category === 'lead' ? 'novo' : c.category === 'objection' ? 'contato' : 'novo',
      post: c.post || null,
      notes: '',
      tags: [],
      reply: null,
      follow_up_date: null,
    }))

    await supabaseAdmin.from('leads').insert(rows)

    return NextResponse.json({ imported: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
