import { NextRequest, NextResponse } from 'next/server'
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
    const { handle } = await req.json()
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

    const username = handle.replace('@', '')

    const postsData = await igPost('/api/instagram/posts', { username })
    const edges = postsData?.result?.edges || []
    const posts = edges.map((e: any) => e.node).filter(Boolean).slice(0, 12)

    if (posts.length === 0) {
      return NextResponse.json({ temas: 'Sem posts visíveis para analisar', gaps: [], recentPosts: [] })
    }

    const postSummaries = posts.map((p: any) => {
      const caption = p.caption?.text?.slice(0, 120) || ''
      const likes = p.like_count || 0
      const comments = p.comment_count || 0
      return `- "${caption}" | ${likes} likes, ${comments} comentários`
    }).join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Analisa os posts recentes do concorrente @${username} no Instagram (nicho: vendas e negócios para empresários brasileiros).

Posts recentes:
${postSummaries}

Retorna APENAS JSON válido:
{
  "temas": "resumo dos 3-4 temas principais que este concorrente explora",
  "frequencia": "estimativa de frequência de posts por semana",
  "tom": "tom e estilo do conteúdo em 1 frase",
  "pontos_fortes": ["ponto forte 1", "ponto forte 2"],
  "gaps": ["gap ou oportunidade que ele não explora 1", "gap 2"],
  "recentPosts": [
    {"caption": "primeiros 60 chars da legenda", "likes": 0, "comments": 0}
  ]
}

Em recentPosts inclui apenas os 5 posts com mais likes.`,
      }],
    })

    const raw = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')
      .replace(/```json|```/g, '')
      .trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ temas: 'Erro na análise', gaps: [], recentPosts: [] })

    return NextResponse.json(JSON.parse(match[0]))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
