import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { tema, estilos, agressividade, quantidade, contexto } = await req.json()

    // Load patterns from memory
    const { data: patterns } = await supabaseAdmin.from('patterns').select('*').order('frequency', { ascending: false }).limit(10)
    const { data: videos } = await supabaseAdmin.from('videos').select('gancho, tema, viral_score').gte('viral_score', 7).order('viral_score', { ascending: false }).limit(5)

    const memContext = patterns && patterns.length > 0
      ? `PADRÕES APRENDIDOS DOS SEUS VÍDEOS (${patterns.length} padrões):\n${patterns.map((p: any) => `- ${p.name} (${p.frequency}x)`).join('\n')}\n\nGANCHOS QUE MAIS PERFORMARAM:\n${(videos || []).map((v: any) => `- "${v.gancho}" (score: ${v.viral_score})`).join('\n')}`
      : 'Nenhum vídeo analisado ainda — use conhecimento geral de viralização no Instagram BR.'

    const agDesc: Record<number, string> = { 1: 'levemente provocativo', 2: 'provocativo direto', 3: 'agressivo sem rodeios', 4: 'muito agressivo e acusatório', 5: 'extremo, sem filtro, choque total' }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Você é engenheiro de conteúdo viral do Instagram especializado no mercado brasileiro de negócios.

MARCA: HUVEN — escola de vendas para empresários. Tom: direto, sem filtro, fé integrada, linguagem de rua com autoridade de mentor.

${memContext}

PARÂMETROS:
- Tema: ${tema}
- Agressividade: ${agressividade}/5 (${agDesc[agressividade] || 'agressivo'})
- Estilos: ${estilos.join(', ')}
${contexto ? `- Contexto extra: ${contexto}` : ''}

Gere ${quantidade} headlines. Para cada uma entregue: headline, scores virais, roteiro em 4 atos, 2 variações A/B, legenda otimizada, hashtags.

Responda APENAS em JSON válido sem markdown sem texto antes ou depois:
{"headlines":[{"texto":"","scores":{"choque":9,"divisao":8,"salvamento":7,"compartilhamento":9},"roteiro":[{"ato":"GANCHO","tempo":"0–3s","instrucao":""},{"ato":"DESENVOLVIMENTO","tempo":"3–40s","instrucao":""},{"ato":"VIRADA","tempo":"40–55s","instrucao":""},{"ato":"CTA","tempo":"55–65s","instrucao":""}],"variantes":[{"label":"Versão A","texto":""},{"label":"Versão B","texto":""}],"legenda":"","hashtags":["#vendas"]}]}`
      }]
    })

    const raw = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Invalid JSON')
    return NextResponse.json(JSON.parse(match[0]))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
