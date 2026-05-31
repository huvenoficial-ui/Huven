'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'

export default function GrowthPage() {
  const { user, loading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('instagram_profile').select('*').order('last_synced', { ascending: false }).limit(1).single(),
      supabase.from('instagram_metrics').select('*').order('date', { ascending: true }).limit(90),
    ]).then(([{ data: prof }, { data: met }]) => {
      setProfile(prof)
      setMetrics(met || [])
      setLoading(false)
    })
  }, [user])

  const syncNow = async () => {
    if (!profile) return
    setSyncing(true)
    const res = await fetch('/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: profile.username })
    })
    const data = await res.json()
    if (!data.error) {
      setProfile((p: any) => ({ ...p, followers: data.followers, following: data.following, posts: data.posts }))
      setMetrics((m: any[]) => {
        const today = new Date().toISOString().split('T')[0]
        const exists = m.find(x => x.date === today)
        if (exists) return m.map(x => x.date === today ? { ...x, followers: data.followers } : x)
        return [...m, { date: today, followers: data.followers, following: data.following, posts_count: data.posts }]
      })
    }
    setSyncing(false)
  }

  if (authLoading) return null

  const noData = !loading && !profile

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Crescimento</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
              {profile ? `@${profile.username}` : 'Dados reais do teu Instagram'}
            </p>
          </div>
          {profile && (
            <button onClick={syncNow} disabled={syncing} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              padding: '0.5rem 1rem', background: syncing ? '#1C1F28' : 'rgba(201,162,74,0.1)',
              color: syncing ? '#5A5E6B' : '#C9A24A', border: '1px solid rgba(201,162,74,0.3)',
              cursor: syncing ? 'not-allowed' : 'pointer', borderRadius: 4
            }}>
              {syncing ? 'Sincronizando...' : '⟳ Sincronizar agora'}
            </button>
          )}
        </div>

        {noData ? (
          <div style={{ background: '#161920', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', marginBottom: 8 }}>Sem dados ainda</div>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 1.5rem' }}>
              Vai a Configurações → escreve o teu @handle → clica Ligar.
            </p>
          </div>
        ) : loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>CARREGANDO...</div>
        ) : profile ? (
          <>
            {/* Profile card */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginBottom: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
              {profile.profile_pic_url && (
                <img src={profile.profile_pic_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#F0EDE8' }}>
                  @{profile.username} {profile.is_verified && <span style={{ color: '#C9A24A' }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', marginTop: 3, lineHeight: 1.5 }}>{profile.biography}</div>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#3A3E4A', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
                Última sync<br />{new Date(profile.last_synced).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Seguidores', value: profile.followers?.toLocaleString('pt-BR') ?? '—' },
                { label: 'Seguindo', value: profile.following?.toLocaleString('pt-BR') ?? '—' },
                { label: 'Posts', value: profile.posts?.toLocaleString('pt-BR') ?? '—' },
                { label: 'Pontos históricos', value: metrics.length.toString() },
              ].map(m => (
                <div key={m.label} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '1rem 1.2rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.02em', color: '#C9A24A' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                Crescimento de seguidores
                {metrics.length < 7 && (
                  <span style={{ color: '#5A5E6B', marginLeft: 12, letterSpacing: '0.1em' }}>
                    · {metrics.length} ponto{metrics.length !== 1 ? 's' : ''} — acumula com o tempo
                  </span>
                )}
              </div>
              {metrics.length >= 2 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#5A5E6B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                    <Tooltip contentStyle={{ background: '#1C1F28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.75rem' }} labelStyle={{ color: '#5A5E6B' }} itemStyle={{ color: '#C9A24A' }} formatter={(v: any) => [v.toLocaleString('pt-BR'), 'Seguidores']} />
                    <Line type="monotone" dataKey="followers" stroke="#C9A24A" strokeWidth={2} dot={{ fill: '#C9A24A', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-0.03em', color: '#C9A24A' }}>
                    {profile.followers?.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>seguidores hoje</div>
                  <div style={{ fontSize: '0.72rem', color: '#3A3E4A', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>
                    O gráfico cresce diariamente à medida que a sync automática acumula dados
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
