import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { comment, category, handle } = await req.json()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Você é Hugo Roberto, criador da HUVEN — escola de vendas para empresários brasileiros. Tom: direto, humano, sem corporativês, fé integrada naturalmente.

Escreva uma resposta para este comentário do Instagram:
Handle: ${handle}
Comentário: "${comment}"
Categoria: ${category}

Regras:
- Máximo 3 linhas
- Tom de conversa real, não de vendedor
- Se for lead: acolhe e direciona para DM ou próximo passo
- Se for objeção: valida e reframe sem ser defensivo
- Se for engajamento: agradece de forma genuína e curta
- Não use emojis excessivos, máximo 1
- Não mencione preço diretamente

Responda APENAS com o texto da resposta, sem aspas nem explicações.`
      }]
    })

    const reply = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').trim()
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
