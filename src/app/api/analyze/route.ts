import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase-server'

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
            text: `Analise estes ${imageContents.length} frames de um Reel do Instagram (nicho: vendas para empresários brasileiros — HUVEN).

Os frames estão ordenados cronologicamente. Os PRIMEIROS 3 frames são do início do vídeo (0–3 segundos) onde o gancho acontece.

REGRAS CRÍTICAS PARA O GANCHO:
1. O gancho é a PRIMEIRA frase falada ou texto visível nos primeiros frames
2. Lê QUALQUER texto sobreposto, legenda, título ou caption visível nos frames — esse é o gancho real
3. Se há texto na tela no frame 1 ou 2, esse texto É o gancho — copia-o exactamente
4. Se a pessoa está falando mas não há texto visível, deduz o gancho da expressão facial, gestos e contexto do início
5. NUNCA inventes um gancho — usa o que está visível ou indica "gancho no áudio (não detectável visualmente)"

SOBRE VÍDEOS COM FOCO EM ÁUDIO:
- Se os frames mostram cenário estático ou pessoa parada sem texto, o valor está no áudio
- Nesse caso, usa o contexto visual (ambiente, expressão, postura corporal) para inferir o tema
- Indica no gancho que é baseado em contexto visual

Responda SOMENTE com este JSON, sem texto antes ou depois:
{"tema":"tema em 5 palavras baseado no que é visível","gancho":"texto exacto visível no frame OU descrição do que a pessoa está dizendo com base no contexto visual","estrutura":"como o video está organizado em 1 frase","producao":"cenario roupa iluminacao cortes em 1 frase","potencial":{"score":8,"motivo":"por que esse score em 1 frase"},"pilares":{"choque":8,"divisao":7,"salvamento":6,"compartilhamento":9},"padroes":["padrao1","padrao2","padrao3"],"insights":"observacao estrategica principal em 1 frase"}`
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
