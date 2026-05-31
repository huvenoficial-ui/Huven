'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function GrowthPage() {
  const { user, loading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('instagram_metrics')
      .select('*')
      .order('date', { ascending: true })
      .limit(90)
      .then(({ data }) => { setMetrics(data || []); setLoading(false) })
  }, [user])

  const latest = metrics[metrics.length - 1]
  const prev = metrics[metrics.length - 2]

  const delta = (field: string) => {
    if (!latest || !prev || !latest[field] || !prev[field]) return null
    const diff = latest[field] - prev[field]
    return diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR')
  }

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Crescimento</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Dados reais do teu Instagram</p>
          </div>
        </div>

        {!loading && metrics.length === 0 ? (
          <div style={{ background: '#161920', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', marginBottom: 8 }}>Sem dados ainda</div>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 1.5rem' }}>
              Conecta o teu Instagram para ver métricas reais de seguidores, alcance e crescimento. Precisas de uma conta Business ou Creator com o Instagram Graph API.
            </p>
            <div style={{ display: 'inline-block', padding: '0.6rem 1.2rem', background: 'rgba(201,162,74,0.07)', border: '1px solid rgba(201,162,74,0.25)', borderRadius: 6, fontSize: '0.78rem', color: '#C9A24A', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
              INSTAGRAM API — EM BREVE
            </div>
          </div>
        ) : !loading && metrics.length > 0 ? (
          <>
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Seguidores', value: latest?.followers?.toLocaleString('pt-BR') ?? '—', delta: delta('followers') },
                { label: 'Seguindo', value: latest?.following?.toLocaleString('pt-BR') ?? '—', delta: delta('following') },
                { label: 'Posts', value: latest?.posts_count?.toLocaleString('pt-BR') ?? '—', delta: delta('posts_count') },
                { label: 'Alcance médio', value: latest?.avg_reach ? `${(latest.avg_reach/1000).toFixed(1)}k` : '—', delta: null },
              ].map(m => (
                <div key={m.label} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '1rem 1.2rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.02em', color: '#F0EDE8' }}>{m.value}</div>
                  {m.delta && <div style={{ fontSize: '0.7rem', marginTop: 3, color: m.delta.startsWith('+') ? '#44ff88' : '#ff6666', fontFamily: 'Inter, sans-serif' }}>{m.delta} vs ontem</div>}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                Seguidores ao longo do tempo
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={metrics} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1C1F28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.75rem' }} labelStyle={{ color: '#5A5E6B' }} itemStyle={{ color: '#C9A24A' }} />
                  <Line type="monotone" dataKey="followers" stroke="#C9A24A" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>
            CARREGANDO...
          </div>
        )}
      </div>
    </div>
  )
}
