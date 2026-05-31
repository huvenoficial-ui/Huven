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
  // AI analysis
  frequencia?: string
  tom?: string
  pontos_fortes?: string[]
  recentPosts?: { caption: string; likes: number; comments: number }[]
}

export default function CompetitorsPage() {
  const { user, loading: authLoading } = useAuth()
  const [comps, setComps] = useState<Competitor[]>([])
  const [newHandle, setNewHandle] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [myFollowers, setMyFollowers] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('competitors').select('*').order('created_at', { ascending: false }),
      supabase.from('instagram_profile').select('followers').order('followers', { ascending: false }).limit(1).single(),
    ]).then(([{ data: compsData }, { data: profileData }]) => {
      setComps(compsData || [])
      if (profileData) setMyFollowers(profileData.followers)
      setLoading(false)
    })
  }, [user])

  const scrapeProfile = async (handle: string): Promise<any> => {
    const res = await fetch('/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle.replace('@', '') }),
    })
    return res.json()
  }

  const analyzeContent = async (handle: string): Promise<any> => {
    const res = await fetch('/api/competitors/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    })
    return res.json()
  }

  const addComp = async () => {
    if (!newHandle.trim() || !user) return
    setAdding(true)
    const handle = newHandle.startsWith('@') ? newHandle : '@' + newHandle

    const [scraped, analysis] = await Promise.all([
      scrapeProfile(handle),
      analyzeContent(handle),
    ])

    const { data } = await supabase.from('competitors').insert({
      handle,
      temas: analysis.temas || 'Análise manual',
      gaps: analysis.gaps || [],
      notes: '',
      followers: scraped.followers,
      following: scraped.following,
      posts: scraped.posts,
      engagement_rate: scraped.engagementRate,
      last_synced: new Date().toISOString(),
    }).select().single()

    if (data) {
      setComps(prev => [{
        ...data,
        frequencia: analysis.frequencia,
        tom: analysis.tom,
        pontos_fortes: analysis.pontos_fortes,
        recentPosts: analysis.recentPosts,
      }, ...prev])
      setExpanded(data.id)
    }
    setNewHandle('')
    setAdding(false)
  }

  const syncComp = async (comp: Competitor) => {
    setSyncing(comp.id)
    const [scraped, analysis] = await Promise.all([
      scrapeProfile(comp.handle),
      analyzeContent(comp.handle),
    ])

    if (!scraped.error) {
      const updates = {
        temas: analysis.temas || comp.temas,
        gaps: analysis.gaps || comp.gaps,
        followers: scraped.followers,
        following: scraped.following,
        posts: scraped.posts,
        engagement_rate: scraped.engagementRate,
        last_synced: new Date().toISOString(),
      }
      await supabase.from('competitors').update(updates).eq('id', comp.id)
      setComps(prev => prev.map(c => c.id === comp.id
        ? { ...c, ...updates, frequencia: analysis.frequencia, tom: analysis.tom, pontos_fortes: analysis.pontos_fortes, recentPosts: analysis.recentPosts }
        : c
      ))
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Concorrentes</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>
              Monitora estratégia, temas e crescimento de qualquer perfil público
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
              {adding ? 'Analisando...' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>CARREGANDO...</div>
        ) : comps.length === 0 ? (
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: 8 }}>Nenhum concorrente adicionado</div>
            <p style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>Adiciona um @handle para ver dados reais e análise de conteúdo.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comps.map(c => {
              const followerDiff = c.followers && myFollowers ? c.followers - myFollowers : null
              const isExpanded = expanded === c.id
              return (
                <div key={c.id} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{ padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#5A5E6B', flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                      {c.handle.replace('@', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{c.handle}</div>
                          {c.last_synced && <div style={{ fontSize: '0.62rem', color: '#3A3E4A', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>sync {new Date(c.last_synced).toLocaleDateString('pt-BR')}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setExpanded(isExpanded ? null : c.id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#5A5E6B', fontSize: '0.7rem', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
                            {isExpanded ? '▲ menos' : '▼ análise'}
                          </button>
                          <button onClick={() => syncComp(c)} disabled={syncing === c.id} style={{ background: 'none', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', fontSize: '0.7rem', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
                            {syncing === c.id ? '...' : '⟳'}
                          </button>
                          <button onClick={() => deleteComp(c.id)} style={{ background: 'none', border: '1px solid rgba(255,68,68,0.15)', color: '#ff6666', fontSize: '0.65rem', padding: '3px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>×</button>
                        </div>
                      </div>

                      {/* Stats */}
                      {c.followers && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
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
                          {followerDiff > 0
                            ? `▲ ${followerDiff.toLocaleString('pt-BR')} seguidores à frente de ti`
                            : `▼ ${Math.abs(followerDiff).toLocaleString('pt-BR')} seguidores abaixo de ti`}
                        </div>
                      )}

                      {/* Themes summary */}
                      {c.temas && (
                        <div style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', padding: '6px 8px', background: '#111318', borderRadius: 4 }}>
                          <span style={{ color: '#C9A24A', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 6 }}>Temas:</span>
                          {c.temas}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded analysis */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {c.frequencia && (
                          <div style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#C9A24A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Frequência</div>
                            <div style={{ fontSize: '0.82rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{c.frequencia}</div>
                          </div>
                        )}
                        {c.tom && (
                          <div style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#C9A24A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Tom e estilo</div>
                            <div style={{ fontSize: '0.82rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{c.tom}</div>
                          </div>
                        )}
                      </div>

                      {c.pontos_fortes && c.pontos_fortes.length > 0 && (
                        <div style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#44ff88', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Pontos fortes</div>
                          {c.pontos_fortes.map((p, i) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', padding: '3px 0', display: 'flex', gap: 6 }}>
                              <span style={{ color: '#44ff88', flexShrink: 0 }}>✓</span> {p}
                            </div>
                          ))}
                        </div>
                      )}

                      {c.gaps && c.gaps.length > 0 && (
                        <div style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#C9A24A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Gaps — oportunidades que ele não explora</div>
                          {c.gaps.map((g, i) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', padding: '3px 0', display: 'flex', gap: 6 }}>
                              <span style={{ color: '#C9A24A', flexShrink: 0 }}>→</span> {g}
                            </div>
                          ))}
                        </div>
                      )}

                      {c.recentPosts && c.recentPosts.length > 0 && (
                        <div style={{ background: '#111318', borderRadius: 6, padding: '10px 12px' }}>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#C9A24A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Posts com mais impacto</div>
                          {c.recentPosts.map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
                              <div style={{ fontSize: '0.75rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', flex: 1, lineHeight: 1.4 }}>{p.caption}</div>
                              <div style={{ fontSize: '0.7rem', color: '#F0EDE8', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, textAlign: 'right' }}>
                                <span style={{ color: '#C9A24A' }}>{p.likes?.toLocaleString('pt-BR')}</span> ♥<br />
                                <span style={{ color: '#5A5E6B' }}>{p.comments?.toLocaleString('pt-BR')} 💬</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#5A5E6B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Notas pessoais</div>
                        <textarea
                          value={c.notes || ''}
                          onChange={e => updateNotes(c.id, e.target.value)}
                          placeholder="As tuas notas de análise — ideias, oportunidades, o que copiar ou evitar..."
                          style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', padding: '6px 8px', outline: 'none', resize: 'vertical', minHeight: 64, borderRadius: 4, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
