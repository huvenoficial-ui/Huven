import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { comments } = await req.json()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é especialista em classificação de comentários do Instagram para criadores de conteúdo brasileiros de vendas/negócios.

Classifique cada comentário abaixo em uma das categorias:
- "lead": pergunta sobre produto, mentoria, preço, como comprar, interesse claro
- "objection": discordância, ceticismo, objeção de preço/resultado
- "engagement": elogio, compartilhamento, reação positiva sem intenção de compra
- "ignore": spam, irrelevante, emoji sem conteúdo

Para cada um, dê também um score de temperatura de 0–10 (10 = lead mais quente).

Comentários:
${comments.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

Responda APENAS em JSON válido sem markdown:
{"classified":[{"id":"1","handle":"@usuario","text":"texto","category":"lead","score":8.5}]}`
      }]
    })

    const raw = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Invalid JSON')
    const result = JSON.parse(match[0])

    // Save leads to Supabase
    const leads = result.classified.filter((c: any) => c.category === 'lead')
    if (leads.length > 0) {
      await supabaseAdmin.from('comments').insert(leads.map((l: any) => ({
        handle: l.handle,
        text: l.text,
        category: l.category,
        score: l.score,
      })))
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
