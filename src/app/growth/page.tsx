'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { useAuth } from '@/hooks/useAuth'

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '15D', days: 15 },
  { label: '30D', days: 30 },
  { label: 'TUDO', days: 999 },
]

function calcProjection(current: number, growthRate: number, days: number) {
  return Math.round(current * Math.pow(1 + growthRate / 100 / 30, days))
}

export default function GrowthPage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [metrics, setMetrics] = useState<any[]>([])
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const res = await fetch('/api/instagram/metrics')
    const { profile: prof, metrics: met } = await res.json()
    setProfile(prof)
    setMetrics(met || [])
    setLoading(false)
  }

  const syncNow = async () => {
    if (!profile) return
    setSyncing(true); setSyncMsg('')
    const res = await fetch('/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username })
    })
    const data = await res.json()
    if (data.error) { setSyncMsg('Erro: ' + data.error) }
    else { setSyncMsg(`✓ ${data.historicalPoints} pontos sincronizados`); loadData() }
    setSyncing(false)
  }

  const filteredMetrics = period === 999 ? metrics : metrics.filter(m => {
    const d = new Date(m.date)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period)
    return d >= cutoff
  })

  const current = profile?.followers || 0
  const oldest = filteredMetrics[0]?.followers
  const newest = filteredMetrics[filteredMetrics.length - 1]?.followers || current
  const periodDays = filteredMetrics.length > 1
    ? Math.max(1, (new Date(filteredMetrics[filteredMetrics.length-1].date).getTime() - new Date(filteredMetrics[0].date).getTime()) / 86400000)
    : 1
  const periodGrowth = oldest ? newest - oldest : 0
  const growthRate = oldest && oldest > 0 ? ((periodGrowth / oldest) * 100).toFixed(2) : '0'
  const dailyGrowth = periodDays > 0 ? Math.round(periodGrowth / periodDays) : 0
  const monthlyRate = parseFloat(growthRate) / periodDays * 30

  const formatK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toString()

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Crescimento</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
              {profile ? `@${profile.username}` : 'Configura o teu handle em Configurações'}
            </p>
          </div>
          {profile && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {syncMsg && <span style={{ fontSize: '0.75rem', color: syncMsg.startsWith('✓') ? '#44ff88' : '#ff8888', fontFamily: 'Inter, sans-serif' }}>{syncMsg}</span>}
              <button onClick={syncNow} disabled={syncing} style={{
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem',
                padding: '0.5rem 1rem', background: 'rgba(201,162,74,0.1)', color: syncing ? '#5A5E6B' : '#C9A24A',
                border: '1px solid rgba(201,162,74,0.3)', cursor: syncing ? 'not-allowed' : 'pointer', borderRadius: 4
              }}>
                {syncing ? '...' : '⟳ Sincronizar'}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>CARREGANDO...</div>
        ) : !profile ? (
          <div style={{ background: '#161920', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>Vai a <strong style={{ color: '#C9A24A' }}>Configurações</strong> → liga o teu @handle.</p>
          </div>
        ) : (
          <>
            {/* Profile + stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Seguidores', value: formatK(profile.followers), delta: periodGrowth > 0 ? `+${formatK(periodGrowth)}` : periodGrowth < 0 ? formatK(periodGrowth) : null, up: periodGrowth >= 0 },
                { label: 'Seguindo', value: formatK(profile.following || 0) },
                { label: 'Posts', value: (profile.posts || 0).toLocaleString('pt-BR') },
                { label: 'Eng. Rate', value: `${profile.engagement_rate || 0}%`, sub: `${profile.avg_likes || 0} likes · ${profile.avg_comments || 0} coment.` },
                { label: `Crescimento ${period === 999 ? 'total' : period+'d'}`, value: `${growthRate}%`, sub: `${dailyGrowth >= 0 ? '+' : ''}${dailyGrowth}/dia`, up: parseFloat(growthRate) >= 0 },
              ].map(m => (
                <div key={m.label} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '1rem 1.2rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#C9A24A' }}>{m.value}</div>
                  {m.delta && <div style={{ fontSize: '0.68rem', color: m.up ? '#44ff88' : '#ff6666', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>{m.delta}</div>}
                  {m.sub && <div style={{ fontSize: '0.65rem', color: '#5A5E6B', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>{m.sub}</div>}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Histórico de seguidores
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {PERIODS.map(p => (
                    <button key={p.days} onClick={() => setPeriod(p.days)} style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em',
                      padding: '3px 8px', cursor: 'pointer', borderRadius: 3,
                      background: period === p.days ? 'rgba(201,162,74,0.12)' : 'none',
                      border: `1px solid ${period === p.days ? 'rgba(201,162,74,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      color: period === p.days ? '#C9A24A' : '#5A5E6B',
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>

              {filteredMetrics.length >= 2 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredMetrics} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}` }} />
                    <YAxis tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={v => formatK(v)} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#1C1F28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.75rem' }}
                      labelStyle={{ color: '#5A5E6B' }}
                      itemStyle={{ color: '#C9A24A' }}
                      formatter={(v: any) => [v.toLocaleString('pt-BR'), 'Seguidores']}
                    />
                    <Line type="monotone" dataKey="followers" stroke="#C9A24A" strokeWidth={2} dot={{ fill: '#C9A24A', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', color: '#C9A24A' }}>{formatK(current)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>
                    {filteredMetrics.length === 1 ? 'Sincroniza novamente amanhã para ver o gráfico' : 'Clica Sincronizar para gerar histórico'}
                  </div>
                </div>
              )}
            </div>

            {/* Daily gains table */}
            {filteredMetrics.length >= 2 && (
              <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginBottom: 14 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Ganhos por dia
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                  {/* Header */}
                  {['Data', 'Seguidores', '+/- por dia'].map(h => (
                    <div key={h} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</div>
                  ))}
                  {/* Rows — newest first */}
                  {[...filteredMetrics].reverse().map((m, i, arr) => {
                    const prev = arr[i + 1]
                    const diff = prev ? m.followers - prev.followers : null
                    const d = new Date(m.date)
                    const dateStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
                    return (
                      <>
                        <div key={m.date+'d'} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#5A5E6B', padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{dateStr}</div>
                        <div key={m.date+'f'} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#F0EDE8', padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.followers?.toLocaleString('pt-BR')}</div>
                        <div key={m.date+'g'} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '0.85rem', padding: '7px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: diff === null ? '#5A5E6B' : diff > 0 ? '#44ff88' : diff < 0 ? '#ff6666' : '#5A5E6B' }}>
                          {diff === null ? '—' : diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR')}
                        </div>
                      </>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Projections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Projecção de crescimento
                </div>
                {[
                  { label: 'Em 7 dias', days: 7 },
                  { label: 'Em 30 dias', days: 30 },
                  { label: 'Em 3 meses', days: 90 },
                  { label: 'Em 6 meses', days: 180 },
                  { label: 'Em 1 ano', days: 365 },
                ].map(r => {
                  const proj = calcProjection(current, monthlyRate || 3, r.days)
                  const diff = proj - current
                  return (
                    <div key={r.days} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>{r.label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Space Grotesk, sans-serif' }}>{formatK(proj)}</span>
                        <span style={{ fontSize: '0.68rem', color: '#44ff88', marginLeft: 6, fontFamily: 'Inter, sans-serif' }}>+{formatK(diff)}</span>
                      </div>
                    </div>
                  )
                })}
                <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#3A3E4A', fontFamily: 'Inter, sans-serif' }}>
                  Taxa mensal estimada: {monthlyRate > 0 ? `+${monthlyRate.toFixed(1)}%` : 'acumula com mais dados'}
                </div>
              </div>

              <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Métricas de conteúdo
                </div>
                {[
                  { label: 'Média de likes por post', value: (profile.avg_likes || 0).toLocaleString('pt-BR') },
                  { label: 'Média de comentários', value: (profile.avg_comments || 0).toLocaleString('pt-BR') },
                  { label: 'Taxa de engajamento', value: `${profile.engagement_rate || 0}%` },
                  { label: 'Total de posts', value: (profile.posts || 0).toLocaleString('pt-BR') },
                  { label: 'Última sync', value: profile.last_synced ? new Date(profile.last_synced).toLocaleDateString('pt-BR') : '—' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>{m.label}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Space Grotesk, sans-serif' }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
