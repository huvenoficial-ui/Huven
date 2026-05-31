'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'

interface Competitor {
  id: string
  handle: string
  temas: string
  gaps: string[]
  notes: string
  followers?: number
  following?: number
  posts?: number
  engagement_rate?: number
  profile_pic_url?: string
  biography?: string
  last_synced?: string
}

export default function CompetitorsPage() {
  const { user, loading: authLoading } = useAuth()
  const [comps, setComps] = useState<Competitor[]>([])
  const [newHandle, setNewHandle] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('competitors').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setComps(data || []); setLoading(false) })
  }, [user])

  const scrapeProfile = async (handle: string): Promise<any> => {
    const res = await fetch('/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle.replace('@', '') })
    })
    return res.json()
  }

  const addComp = async () => {
    if (!newHandle.trim() || !user) return
    setAdding(true)
    const handle = newHandle.startsWith('@') ? newHandle : '@' + newHandle

    // Scrape their profile
    const scraped = await scrapeProfile(handle)

    const { data } = await supabase.from('competitors').insert({
      handle,
      temas: scraped.error ? 'Análise manual' : `${scraped.followers?.toLocaleString('pt-BR')} seguidores · ${scraped.engagementRate}% eng.`,
      gaps: [],
      notes: '',
      followers: scraped.followers,
      following: scraped.following,
      posts: scraped.posts,
      engagement_rate: scraped.engagementRate,
      last_synced: new Date().toISOString(),
    }).select().single()
    if (data) setComps(prev => [data, ...prev])
    setNewHandle('')
    setAdding(false)
  }

  const syncComp = async (comp: Competitor) => {
    setSyncing(comp.id)
    const scraped = await scrapeProfile(comp.handle)
    if (!scraped.error) {
      const updates = {
        temas: `${scraped.followers?.toLocaleString('pt-BR')} seguidores · ${scraped.engagementRate}% eng.`,
        followers: scraped.followers,
        following: scraped.following,
        posts: scraped.posts,
        engagement_rate: scraped.engagementRate,
        last_synced: new Date().toISOString(),
      }
      await supabase.from('competitors').update(updates).eq('id', comp.id)
      setComps(prev => prev.map(c => c.id === comp.id ? { ...c, ...updates } : c))
    }
    setSyncing(null)
  }

  const deleteComp = async (id: string) => {
    setComps(prev => prev.filter(c => c.id !== id))
    await supabase.from('competitors').delete().eq('id', id)
  }

  const updateNotes = async (id: string, notes: string) => {
    setComps(prev => prev.map(c => c.id === id ? { ...c, notes } : c))
    await supabase.from('competitors').update({ notes }).eq('id', id)
  }

  if (authLoading) return null

  // My own profile for comparison
  const myFollowers = 17756

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Concorrentes</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
              Monitoriza qualquer perfil público · dados reais via scraping
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newHandle}
              onChange={e => setNewHandle(e.target.value)}
              placeholder="@handle"
              onKeyDown={e => e.key === 'Enter' && addComp()}
              style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', padding: '0.6rem 0.9rem', outline: 'none', width: 180, borderRadius: 4 }}
            />
            <button onClick={addComp} disabled={adding || !newHandle.trim()} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem',
              padding: '0 1.2rem', background: adding ? '#1C1F28' : '#C9A24A', color: adding ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: 'pointer', borderRadius: 4
            }}>
              {adding ? '...' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>CARREGANDO...</div>
        ) : comps.length === 0 ? (
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: 8 }}>Nenhum concorrente adicionado</div>
            <p style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>Adiciona um @handle para ver os dados reais do perfil.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comps.map(c => {
              const followerDiff = c.followers && myFollowers ? c.followers - myFollowers : null
              return (
                <div key={c.id} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#5A5E6B', flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                      {c.handle.replace('@','').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{c.handle}</div>
                          {c.last_synced && <div style={{ fontSize: '0.62rem', color: '#3A3E4A', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>sync {new Date(c.last_synced).toLocaleDateString('pt-BR')}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => syncComp(c)} disabled={syncing === c.id} style={{ background: 'none', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', fontSize: '0.7rem', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
                            {syncing === c.id ? '...' : '⟳'}
                          </button>
                          <button onClick={() => deleteComp(c.id)} style={{ background: 'none', border: '1px solid rgba(255,68,68,0.15)', color: '#ff6666', fontSize: '0.65rem', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>×</button>
                        </div>
                      </div>

                      {/* Stats */}
                      {c.followers && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                          {[
                            { label: 'Seguidores', value: c.followers?.toLocaleString('pt-BR'), highlight: true },
                            { label: 'Seguindo', value: c.following?.toLocaleString('pt-BR') },
                            { label: 'Posts', value: c.posts?.toLocaleString('pt-BR') },
                            { label: 'Eng. Rate', value: `${c.engagement_rate}%` },
                          ].map(m => (
                            <div key={m.label} style={{ background: '#111318', padding: '6px 8px', borderRadius: 4 }}>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#5A5E6B', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: m.highlight ? '#C9A24A' : '#F0EDE8' }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {followerDiff !== null && (
                        <div style={{ fontSize: '0.72rem', color: followerDiff > 0 ? '#ff8888' : '#44ff88', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                          {followerDiff > 0 ? `▲ ${followerDiff.toLocaleString('pt-BR')} seguidores à frente de ti` : `▼ ${Math.abs(followerDiff).toLocaleString('pt-BR')} seguidores abaixo de ti`}
                        </div>
                      )}

                      <textarea
                        value={c.notes || ''}
                        onChange={e => updateNotes(c.id, e.target.value)}
                        placeholder="Notas de análise — temas, estratégias, gaps..."
                        style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', padding: '6px 8px', outline: 'none', resize: 'vertical', minHeight: 52, borderRadius: 4 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
