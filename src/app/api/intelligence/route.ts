import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { anthropic } from '@/lib/anthropic'

export const maxDuration = 60

export async function POST() {
  try {
    const [
      { data: videos },
      { data: patterns },
      { data: profile },
      { data: metrics },
      { data: leads },
    ] = await Promise.all([
      supabaseAdmin.from('videos').select('tema,gancho,viral_score,padroes,insights,estrutura').order('viral_score', { ascending: false }).limit(10),
      supabaseAdmin.from('patterns').select('name,frequency').order('frequency', { ascending: false }).limit(15),
      supabaseAdmin.from('instagram_profile').select('*').order('followers', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('instagram_metrics').select('date,followers').order('date', { ascending: false }).limit(30),
      supabaseAdmin.from('leads').select('stage,score,tags').limit(50),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'Liga o teu Instagram primeiro em Configurações para gerar análise estratégica.' }, { status: 400 })
    }
    if (!videos?.length) {
      return NextResponse.json({ error: 'Analisa pelo menos 1 vídeo antes de gerar a análise estratégica. A IA precisa de dados reais do teu conteúdo.' }, { status: 400 })
    }

    const avgScore = videos?.length ? (videos.reduce((s, v) => s + (v.viral_score || 0), 0) / videos.length).toFixed(1) : '—'
    const topPatterns = patterns?.slice(0, 8).map(p => `${p.name} (${p.frequency}x)`).join(', ') || 'nenhum'
    const leadsByStage = leads?.reduce((acc: any, l) => { acc[l.stage] = (acc[l.stage] || 0) + 1; return acc }, {}) || {}
    const metricsRecent = metrics?.slice(0, 7) || []
    const followerGrowth = metricsRecent.length >= 2
      ? metricsRecent[0].followers - metricsRecent[metricsRecent.length - 1].followers
      : 0

    const context = `
DADOS DO CRIADOR (HUVEN — vendas para empresários brasileiros):

INSTAGRAM:
- Handle: @${profile?.username || 'não conectado'}
- Seguidores: ${profile?.followers?.toLocaleString('pt-BR') || '—'}
- Engagement rate: ${profile?.engagement_rate || '—'}%
- Média likes/post: ${profile?.avg_likes || '—'}
- Crescimento últimos 7 dias: ${followerGrowth > 0 ? '+' : ''}${followerGrowth} seguidores

VÍDEOS ANALISADOS (${videos?.length || 0} total):
- Score viral médio: ${avgScore}/10
- Vídeos com score ≥8: ${videos?.filter(v => v.viral_score >= 8).length || 0}
- Top ganchos: ${videos?.slice(0, 3).map(v => `"${v.gancho}"`).join(' | ') || 'nenhum'}
- Top temas: ${videos?.slice(0, 5).map(v => v.tema).join(', ') || 'nenhum'}

PADRÕES VIRAIS DETECTADOS:
${topPatterns}

CRM LEADS:
- Lead Novo: ${leadsByStage['novo'] || 0}
- Em Contacto: ${leadsByStage['contato'] || 0}
- Proposta: ${leadsByStage['proposta'] || 0}
- Fechado: ${leadsByStage['fechado'] || 0}
- Total leads: ${leads?.length || 0}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é um estrategista especializado em crescimento de criadores de conteúdo no Instagram brasileiro, com foco em negócios e vendas.

Com base nos dados abaixo, faça uma análise estratégica completa e entregue um plano de acção detalhado e específico.

${context}

Entregue SOMENTE este JSON sem markdown:
{
  "diagnostico": {
    "pontuacao_geral": 7,
    "resumo": "2-3 frases directas sobre o estado actual do criador",
    "pontos_fortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
    "pontos_criticos": ["ponto crítico 1", "ponto crítico 2"]
  },
  "oportunidades": [
    {"titulo": "título da oportunidade", "impacto": "alto|medio|baixo", "descricao": "1 frase de o que fazer e por quê"}
  ],
  "plano_proximos_30_dias": [
    {"semana": 1, "foco": "foco da semana", "acoes": ["acção específica 1", "acção específica 2", "acção específica 3"]},
    {"semana": 2, "foco": "foco da semana", "acoes": ["acção 1", "acção 2", "acção 3"]},
    {"semana": 3, "foco": "foco da semana", "acoes": ["acção 1", "acção 2", "acção 3"]},
    {"semana": 4, "foco": "foco da semana", "acoes": ["acção 1", "acção 2", "acção 3"]}
  ],
  "temas_recomendados": ["tema 1 específico", "tema 2 específico", "tema 3 específico", "tema 4 específico", "tema 5 específico"],
  "meta_seguidores": {"30d": 18500, "90d": 21000, "realista": true, "observacao": "1 frase sobre a meta"},
  "alerta_critico": "se houver algo urgente a corrigir, diz aqui em 1 frase. Se não houver, deixa em branco."
}`
      }]
    })

    const raw = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('').replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Invalid JSON from AI')

    return NextResponse.json(JSON.parse(match[0]))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
