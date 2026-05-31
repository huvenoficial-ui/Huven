import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { frames, filename } = await req.json()
    if (!frames || frames.length === 0) return NextResponse.json({ error: 'No frames' }, { status: 400 })

    const imageContents = frames.map((b64: string) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 }
    }))

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Analise estes frames de um Reel do Instagram (nicho: vendas para empresários brasileiros — HUVEN).

Responda SOMENTE com este JSON preenchido, sem texto antes ou depois:
{"tema":"tema em 5 palavras","gancho":"frase de abertura exata","estrutura":"como o video esta organizado em 1 frase","producao":"cenario roupa iluminacao cortes em 1 frase","potencial":{"score":8,"motivo":"por que esse score em 1 frase"},"pilares":{"choque":8,"divisao":7,"salvamento":6,"compartilhamento":9},"padroes":["padrao1","padrao2","padrao3"],"insights":"observacao estrategica principal em 1 frase"}`
          }
        ]
      }]
    })

    const raw = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Invalid JSON response')
    const analysis = JSON.parse(match[0])

    // Save to Supabase
    const { data: videoRecord } = await supabaseAdmin.from('videos').insert({
      filename,
      tema: analysis.tema,
      gancho: analysis.gancho,
      estrutura: analysis.estrutura,
      producao: analysis.producao,
      viral_score: analysis.potencial?.score,
      viral_score_motivo: analysis.potencial?.motivo,
      pilar_choque: analysis.pilares?.choque,
      pilar_divisao: analysis.pilares?.divisao,
      pilar_salvamento: analysis.pilares?.salvamento,
      pilar_compartilhamento: analysis.pilares?.compartilhamento,
      padroes: analysis.padroes,
      insights: analysis.insights,
    }).select().single()

    // Save patterns
    if (analysis.padroes && videoRecord) {
      for (const padrao of analysis.padroes) {
        const { data: existing } = await supabaseAdmin.from('patterns').select('*').eq('name', padrao).single()
        if (existing) {
          await supabaseAdmin.from('patterns').update({ frequency: existing.frequency + 1 }).eq('id', existing.id)
        } else {
          await supabaseAdmin.from('patterns').insert({ name: padrao, frequency: 1 })
        }
      }
    }

    return NextResponse.json(analysis)
  } catch (e: any) {
    console.error('Analyze error:', e)
    return NextResponse.json({ error: e.message, detail: e?.status || e?.code || '' }, { status: 500 })
  }
}
