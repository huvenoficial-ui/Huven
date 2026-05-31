'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import { useAuth } from '@/hooks/useAuth'

const IMPACT_COLOR: Record<string, string> = {
  alto: '#44ff88',
  medio: '#C9A24A',
  baixo: '#5A5E6B',
}

export default function IntelligencePage() {
  const { loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  const analyse = async () => {
    setLoading(true); setError(''); setData(null)
    const res = await fetch('/api/intelligence', { method: 'POST' })
    const json = await res.json()
    if (json.error) setError(json.error)
    else setData(json)
    setLoading(false)
  }

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Inteligência</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
              Cruzamento de dados · plano estratégico personalizado com IA
            </p>
          </div>
          <button onClick={analyse} disabled={loading} style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem',
            padding: '0.7rem 1.5rem', background: loading ? '#1C1F28' : '#C9A24A',
            color: loading ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 4
          }}>
            {loading ? 'Analisando...' : data ? '⟳ Nova análise' : '⚡ Gerar análise'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: '1rem', fontSize: '0.85rem', color: '#ff8888', fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!data && !loading && !error && (
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', marginBottom: 12 }}>Análise estratégica com IA</div>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 1.5rem' }}>
              A IA cruza os dados dos teus vídeos analisados, padrões virais, métricas do Instagram e leads do CRM para gerar um plano estratégico detalhado dos próximos 30 dias.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: '1.5rem' }}>
              {['Vídeos analisados','Padrões virais','Métricas Instagram','Leads CRM'].map(s => (
                <div key={s} style={{ fontSize: '0.72rem', color: '#C9A24A', fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 4, letterSpacing: '0.1em' }}>
                  {s}
                </div>
              ))}
            </div>
            <button onClick={analyse} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem',
              padding: '0.8rem 2rem', background: '#C9A24A', color: '#0D0E12', border: 'none', cursor: 'pointer', borderRadius: 4
            }}>
              ⚡ Gerar análise agora
            </button>
          </div>
        )}

        {loading && (
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#C9A24A', letterSpacing: '0.18em', marginBottom: 12 }}>PROCESSANDO DADOS...</div>
            <p style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>A IA está a analisar todos os teus dados. Aguarda ~10 segundos.</p>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Alert */}
            {data.alerta_critico && (
              <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 8, padding: '0.9rem 1.2rem', fontSize: '0.85rem', color: '#ff8888', fontFamily: 'Inter, sans-serif', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '1rem' }}>⚠</span> <strong>Alerta:</strong> {data.alerta_critico}
              </div>
            )}

            {/* Diagnóstico */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Diagnóstico geral</div>
                <div style={{ background: 'rgba(201,162,74,0.1)', border: '1px solid rgba(201,162,74,0.3)', borderRadius: 6, padding: '4px 12px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#C9A24A' }}>
                  {data.diagnostico?.pontuacao_geral}/10
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, marginBottom: 14 }}>{data.diagnostico?.resumo}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#44ff88', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Pontos fortes</div>
                  {data.diagnostico?.pontos_fortes?.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#44ff88', flexShrink: 0 }}>✓</span> {p}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#ff6666', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Pontos críticos</div>
                  {data.diagnostico?.pontos_criticos?.map((p: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#ff6666', flexShrink: 0 }}>!</span> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Oportunidades */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.4rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Oportunidades identificadas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.oportunidades?.map((o: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: '#111318', borderRadius: 6, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', color: IMPACT_COLOR[o.impacto] || '#5A5E6B', border: `1px solid ${IMPACT_COLOR[o.impacto] || '#5A5E6B'}`, padding: '2px 6px', borderRadius: 3, flexShrink: 0, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                      {o.impacto}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: '#F0EDE8', marginBottom: 3 }}>{o.titulo}</div>
                      <div style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>{o.descricao}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plano 30 dias */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.4rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Plano dos próximos 30 dias</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {data.plano_proximos_30_dias?.map((semana: any) => (
                  <div key={semana.semana} style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#C9A24A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Semana {semana.semana}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.82rem', color: '#F0EDE8', marginBottom: 8, lineHeight: 1.3 }}>{semana.foco}</div>
                    {semana.acoes?.map((a: string, i: number) => (
                      <div key={i} style={{ fontSize: '0.72rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', padding: '3px 0', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 6 }}>
                        <span style={{ color: '#C9A24A', flexShrink: 0 }}>→</span> {a}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Temas + Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Temas recomendados para os próximos posts</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.temas_recomendados?.map((t: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', padding: '6px 10px', background: '#111318', borderRadius: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A' }}>{String(i+1).padStart(2,'0')}</span>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Meta de seguidores</div>
                {[
                  { label: 'Em 30 dias', value: data.meta_seguidores?.['30d'] },
                  { label: 'Em 90 dias', value: data.meta_seguidores?.['90d'] },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>{m.label}</span>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#C9A24A' }}>{m.value?.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
                {data.meta_seguidores?.observacao && (
                  <p style={{ fontSize: '0.75rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', marginTop: 10, lineHeight: 1.5 }}>{data.meta_seguidores.observacao}</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
