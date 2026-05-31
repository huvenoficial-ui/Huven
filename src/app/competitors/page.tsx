'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Competitor {
  id: string
  handle: string
  temas: string
  gaps: string[]
  notes: string
}

export default function CompetitorsPage() {
  const { user, loading: authLoading } = useAuth()
  const [comps, setComps] = useState<Competitor[]>([])
  const [newHandle, setNewHandle] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('competitors').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setComps(data || []); setLoading(false) })
  }, [user])

  const addComp = async () => {
    if (!newHandle.trim() || !user) return
    setAnalyzing(true)
    const handle = newHandle.startsWith('@') ? newHandle : '@' + newHandle
    const { data } = await supabase.from('competitors').insert({
      handle,
      temas: 'Análise manual — conecta Instagram para dados reais',
      gaps: [],
      notes: '',
    }).select().single()
    if (data) setComps(prev => [data, ...prev])
    setNewHandle('')
    setAnalyzing(false)
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
              Monitorização manual — análise automática disponível com Instagram API
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
            <button onClick={addComp} disabled={analyzing || !newHandle.trim()} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem',
              padding: '0 1.2rem', background: '#C9A24A', color: '#0D0E12', border: 'none', cursor: 'pointer', borderRadius: 4
            }}>
              {analyzing ? '...' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {/* Instagram API notice */}
        <div style={{ background: 'rgba(201,162,74,0.05)', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 8, padding: '0.9rem 1.2rem', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ color: '#C9A24A', fontSize: '1rem', flexShrink: 0 }}>ℹ</div>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Análise automática de concorrentes</div>
            <p style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              Para análise automática de temas, frequência de posts e gaps de conteúdo, é necessário integrar o Instagram Graph API. Enquanto isso, usa o campo de notas para análise manual.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.18em' }}>CARREGANDO...</div>
        ) : comps.length === 0 ? (
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: 8 }}>Nenhum concorrente adicionado</div>
            <p style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>Adiciona os handles dos criadores que queres monitorizar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comps.map(c => (
              <div key={c.id} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#5A5E6B', flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif' }}>
                    {c.handle.replace('@','').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{c.handle}</div>
                      <button onClick={() => deleteComp(c.id)} style={{ background: 'none', border: '1px solid rgba(255,68,68,0.15)', color: '#ff6666', fontSize: '0.65rem', padding: '2px 8px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>Remover</button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#5A5E6B', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{c.temas}</div>
                    {c.gaps.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {c.gaps.map(g => (
                          <span key={g} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(201,162,74,0.07)', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', fontFamily: 'Inter, sans-serif' }}>{g}</span>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={c.notes || ''}
                      onChange={e => updateNotes(c.id, e.target.value)}
                      placeholder="Notas de análise manual..."
                      style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', padding: '6px 8px', outline: 'none', resize: 'vertical', minHeight: 60, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
