import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase-server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { frames, filename, audioBase64 } = await req.json()
    if (!frames || frames.length === 0) return NextResponse.json({ error: 'No frames' }, { status: 400 })

    // Try to transcribe audio via Anthropic API (direct fetch to bypass SDK version limits)
    let transcript: string | null = null
    if (audioBase64) {
      try {
        const transcriptRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Transcreve literalmente tudo que é falado neste áudio em português. Retorna apenas a transcrição, sem comentários.',
                },
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'audio/wav', data: audioBase64 },
                },
              ],
            }],
          }),
        })
        const transcriptData = await transcriptRes.json()
        const text = transcriptData?.content?.[0]?.text
        if (text && !transcriptData.error) transcript = text
      } catch {
        // audio transcription failed — proceed with frames only
      }
    }

    const imageContents = frames.map((b64: string) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 }
    }))

    const audioContext = transcript
      ? `\n\nTRANSCRIÇÃO DO ÁUDIO (use isto para o gancho e tema reais):\n"${transcript}"\n\nO gancho é a PRIMEIRA frase da transcrição acima.`
      : '\n\nÁudio não disponível — analisa apenas os frames visuais.'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Analise estes ${imageContents.length} frames de um Reel do Instagram (nicho: vendas para empresários brasileiros — HUVEN).${audioContext}

Os frames estão ordenados cronologicamente. Os PRIMEIROS 3 frames são do início do vídeo (0–3 segundos) onde o gancho acontece.

REGRAS CRÍTICAS PARA O GANCHO:
1. Se tens a transcrição do áudio, o gancho é a PRIMEIRA frase falada — copia-a exactamente
2. Se não tens áudio, lê QUALQUER texto sobreposto, legenda ou título visível nos frames
3. Se não há texto nem áudio, deduz o gancho da expressão facial, gestos e contexto visual
4. NUNCA inventes — usa o que está disponível

Responda SOMENTE com este JSON, sem texto antes ou depois:
{"tema":"tema em 5 palavras","gancho":"primeira frase falada OU texto visível OU descrição visual","estrutura":"como o video está organizado em 1 frase","producao":"cenario roupa iluminacao cortes em 1 frase","potencial":{"score":8,"motivo":"por que esse score em 1 frase"},"pilares":{"choque":8,"divisao":7,"salvamento":6,"compartilhamento":9},"padroes":["padrao1","padrao2","padrao3"],"insights":"observacao estrategica principal em 1 frase"}`
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
