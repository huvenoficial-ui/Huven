'use client'
import { useState, useEffect, Suspense } from 'react'
import Nav from '@/components/Nav'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase-browser'

function InstagramScraper() {
  const [handle, setHandle] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.from('instagram_profile').select('*').order('followers', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) { setProfile(data); setHandle(data.username) } })
  }, [])

  const sync = async () => {
    if (!handle.trim()) return
    setSyncing(true); setResult(null)
    const res = await fetch('/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle.replace('@', '') })
    })
    const data = await res.json()
    setResult(data)
    if (!data.error) setProfile((p: any) => ({ ...p, ...data }))
    setSyncing(false)
  }

  return (
    <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.5rem', marginBottom: 12 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
        Instagram — Dados de crescimento
      </div>

      {profile && !result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0.8rem', background: '#111318', borderRadius: 6 }}>
          {profile.profile_pic_url && (
            <img src={profile.profile_pic_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>@{profile.username}</div>
            <div style={{ fontSize: '0.72rem', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              {profile.followers?.toLocaleString('pt-BR')} seguidores · {profile.posts} posts · {profile.engagement_rate}% eng.
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#44ff88', fontFamily: 'JetBrains Mono, monospace' }}>LIGADO ✓</div>
        </div>
      )}

      {result && !result.error && (
        <div style={{ padding: '0.7rem 1rem', background: 'rgba(68,255,136,0.06)', border: '1px solid rgba(68,255,136,0.2)', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem', color: '#44ff88', fontFamily: 'Inter, sans-serif' }}>
          ✓ @{result.username} · {result.followers?.toLocaleString('pt-BR')} seguidores · {result.historicalPoints} pontos históricos gerados
        </div>
      )}
      {result?.error && (
        <div style={{ padding: '0.7rem 1rem', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 6, marginBottom: 12, fontSize: '0.82rem', color: '#ff8888', fontFamily: 'Inter, sans-serif' }}>
          Erro: {result.error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={handle}
          onChange={e => setHandle(e.target.value)}
          placeholder="@teuhandle"
          onKeyDown={e => e.key === 'Enter' && sync()}
          style={{ flex: 1, background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', padding: '0.65rem 0.9rem', outline: 'none', borderRadius: 4 }}
        />
        <button onClick={sync} disabled={syncing || !handle.trim()} style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem',
          padding: '0 1.2rem', background: syncing ? '#1C1F28' : '#C9A24A',
          color: syncing ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer', borderRadius: 4
        }}>
          {syncing ? 'Sincronizando...' : profile ? '⟳ Actualizar' : '⚡ Ligar'}
        </button>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#3A3E4A', fontFamily: 'Inter, sans-serif', marginTop: 8 }}>
        Sincroniza automaticamente todos os dias. Funciona com qualquer conta pública.
      </p>
    </div>
  )
}

function SettingsContent() {
  const { user } = useAuth()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Configurações</h1>
        <p style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', marginBottom: '2rem' }}>{user?.email}</p>
        <InstagramScraper />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  )
}
