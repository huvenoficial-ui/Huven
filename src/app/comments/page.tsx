'use client'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'

type Stage = 'novo' | 'contato' | 'proposta' | 'fechado' | 'perdido'

interface Lead {
  id: string
  handle: string
  text: string
  score: number
  stage: Stage
  notes: string
  follow_up_date: string | null
  tags: string[]
  post: string | null
  reply: string | null
  created_at: string
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'novo',     label: 'Lead Novo',        color: '#C9A24A', bg: 'rgba(201,162,74,0.04)' },
  { id: 'contato',  label: 'Em Contacto',      color: '#44aaff', bg: 'rgba(68,170,255,0.04)' },
  { id: 'proposta', label: 'Proposta Enviada', color: '#aa88ff', bg: 'rgba(170,136,255,0.04)' },
  { id: 'fechado',  label: 'Fechado ✓',        color: '#44ff88', bg: 'rgba(68,255,136,0.04)' },
  { id: 'perdido',  label: 'Perdido',           color: '#5A5E6B', bg: 'rgba(255,255,255,0.02)' },
]

export default function CRMPage() {
  const { user, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editDate, setEditDate] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [replyLoading, setReplyLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadLeads()
  }, [user])

  const loadLeads = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads((data || []).map(normalise))
    setLoading(false)
  }

  const normalise = (row: any): Lead => ({
    id: row.id,
    handle: row.handle || '',
    text: row.text || '',
    score: row.score || 5,
    stage: row.stage || 'novo',
    notes: row.notes || '',
    follow_up_date: row.follow_up_date || null,
    tags: row.tags || [],
    post: row.post || null,
    reply: row.reply || null,
    created_at: row.created_at,
  })

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId as Stage
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, stage: newStage } : l))
    await supabase.from('leads').update({ stage: newStage }).eq('id', draggableId)
  }

  const saveNotes = async (id: string) => {
    const notes = editNotes[id] ?? leads.find(l => l.id === id)?.notes ?? ''
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l))
    await supabase.from('leads').update({ notes }).eq('id', id)
  }

  const saveDate = async (id: string, date: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, follow_up_date: date } : l))
    await supabase.from('leads').update({ follow_up_date: date || null }).eq('id', id)
  }

  const addTag = async (id: string) => {
    const tag = (newTag[id] || '').trim()
    if (!tag) return
    const lead = leads.find(l => l.id === id)!
    const merged = lead.tags.concat([tag])
    const tags = merged.filter((t, i) => merged.indexOf(t) === i)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, tags } : l))
    setNewTag(prev => ({ ...prev, [id]: '' }))
    await supabase.from('leads').update({ tags }).eq('id', id)
  }

  const removeTag = async (id: string, tag: string) => {
    const lead = leads.find(l => l.id === id)!
    const tags = lead.tags.filter(t => t !== tag)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, tags } : l))
    await supabase.from('leads').update({ tags }).eq('id', id)
  }

  const generateReply = async (lead: Lead) => {
    setReplyLoading(lead.id)
    try {
      const res = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: lead.text, category: lead.stage, handle: lead.handle })
      })
      const data = await res.json()
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, reply: data.reply } : l))
      await supabase.from('leads').update({ reply: data.reply }).eq('id', lead.id)
    } catch (e) { console.error(e) }
    setReplyLoading(null)
  }

  const classifyAndAdd = async () => {
    if (!input.trim() || !user) return
    setAnalyzing(true)
    const lines = input.split('\n').filter(l => l.trim())
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: lines })
      })
      const data = await res.json()
      const newLeads = (data.classified || []).map((c: any) => ({
        handle: c.handle || lines[0],
        text: c.text,
        score: c.score || 5,
        stage: c.category === 'lead' ? 'novo' : c.category === 'objection' ? 'contato' : 'novo',
        notes: '',
        follow_up_date: null,
        tags: [],
        post: c.post || null,
        reply: null,
      }))
      for (const lead of newLeads) {
        await supabase.from('leads').insert(lead)
      }
      setInput('')
      await loadLeads()
    } catch (e) { console.error(e) }
    setAnalyzing(false)
  }

  const deleteLead = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    await supabase.from('leads').delete().eq('id', id)
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0E12' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#5A5E6B', letterSpacing: '0.18em' }}>CARREGANDO CRM...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: '100%', marginBottom: '1.2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Social Selling CRM</h1>
            <p style={{ fontSize: '0.82rem', color: '#5A5E6B', marginTop: '0.2rem', fontFamily: 'Inter, sans-serif' }}>
              {leads.length} lead{leads.length !== 1 ? 's' : ''} · arrasta entre colunas para avançar no funil
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Cole comentários do Instagram (um por linha)..."
              style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', padding: '0.6rem 0.9rem', outline: 'none', width: 260, height: 64, resize: 'none', borderRadius: 4 }}
            />
            <button onClick={classifyAndAdd} disabled={analyzing || !input.trim()} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.82rem',
              padding: '0 1rem', height: 64, background: analyzing ? '#1C1F28' : '#C9A24A',
              color: analyzing ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap'
            }}>
              {analyzing ? '...' : '⚡ Classificar'}
            </button>
          </div>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, alignItems: 'start' }}>
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage.id)
              return (
                <div key={stage.id}>
                  {/* Column header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: stage.color }}>{stage.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '1px 7px' }}>{stageLeads.length}</div>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: 120, background: snapshot.isDraggingOver ? stage.bg : 'transparent',
                          border: `1px solid ${snapshot.isDraggingOver ? stage.color.replace(')', ', 0.2)').replace('rgb', 'rgba') : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 8, padding: 6, transition: 'all 0.15s'
                        }}
                      >
                        {stageLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: snapshot.isDragging ? '#1C1F28' : '#161920',
                                  border: `1px solid ${snapshot.isDragging ? 'rgba(201,162,74,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                  borderRadius: 6, padding: '9px 10px', marginBottom: 6,
                                  cursor: 'grab', userSelect: 'none',
                                  boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none'
                                }}
                              >
                                {/* Card header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>{lead.handle || '—'}</div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: lead.score >= 7 ? '#44ff88' : lead.score >= 5 ? '#C9A24A' : '#5A5E6B', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 3 }}>
                                      {lead.score.toFixed(0)}
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpanded(expanded === lead.id ? null : lead.id) }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5E6B', fontSize: '0.7rem', padding: '1px 4px', lineHeight: 1 }}
                                    >
                                      {expanded === lead.id ? '▲' : '▼'}
                                    </button>
                                  </div>
                                </div>

                                <div style={{ fontSize: '0.73rem', color: '#5A5E6B', lineHeight: 1.4, fontFamily: 'Inter, sans-serif', marginBottom: lead.tags.length > 0 || lead.follow_up_date ? 6 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {lead.text}
                                </div>

                                {lead.follow_up_date && (
                                  <div style={{ fontSize: '0.62rem', color: '#C9A24A', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                                    📅 {lead.follow_up_date}
                                  </div>
                                )}

                                {lead.tags.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    {lead.tags.map(t => (
                                      <span key={t} style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'rgba(201,162,74,0.07)', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>{t}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Expanded section */}
                                {expanded === lead.id && (
                                  <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

                                    {lead.post && (
                                      <div style={{ fontSize: '0.62rem', color: '#3A3E4A', fontFamily: 'JetBrains Mono, monospace' }}>Post: {lead.post}</div>
                                    )}

                                    {/* Notes */}
                                    <div>
                                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Notas</div>
                                      <textarea
                                        value={editNotes[lead.id] ?? lead.notes}
                                        onChange={e => setEditNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                        onBlur={() => saveNotes(lead.id)}
                                        placeholder="Adicionar nota..."
                                        style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', padding: '5px 7px', outline: 'none', resize: 'vertical', minHeight: 52, borderRadius: 3 }}
                                      />
                                    </div>

                                    {/* Follow-up */}
                                    <div>
                                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Follow-up</div>
                                      <input
                                        type="date"
                                        value={editDate[lead.id] ?? lead.follow_up_date ?? ''}
                                        onChange={e => { setEditDate(prev => ({ ...prev, [lead.id]: e.target.value })); saveDate(lead.id, e.target.value) }}
                                        style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', padding: '4px 7px', outline: 'none', borderRadius: 3, width: '100%', colorScheme: 'dark' }}
                                      />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 3 }}>Tags</div>
                                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
                                        {lead.tags.map(t => (
                                          <span key={t} onClick={() => removeTag(lead.id, t)} style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'rgba(201,162,74,0.07)', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{t} ×</span>
                                        ))}
                                      </div>
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <input
                                          value={newTag[lead.id] || ''}
                                          onChange={e => setNewTag(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                          onKeyDown={e => e.key === 'Enter' && addTag(lead.id)}
                                          placeholder="nova tag..."
                                          style={{ flex: 1, background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', padding: '3px 6px', outline: 'none', borderRadius: 3 }}
                                        />
                                        <button onClick={() => addTag(lead.id)} style={{ background: 'rgba(201,162,74,0.1)', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', fontSize: '0.7rem', padding: '3px 7px', cursor: 'pointer', borderRadius: 3 }}>+</button>
                                      </div>
                                    </div>

                                    {/* Reply */}
                                    {lead.reply && (
                                      <div style={{ padding: '6px 8px', background: 'rgba(68,170,255,0.06)', border: '1px solid rgba(68,170,255,0.15)', borderRadius: 4, fontSize: '0.72rem', color: '#88bbff', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#44aaff', marginBottom: 3 }}>RESPOSTA IA:</div>
                                        {lead.reply}
                                        <button onClick={() => navigator.clipboard.writeText(lead.reply!)} style={{ display: 'block', marginTop: 4, fontSize: '0.6rem', color: '#44aaff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Copiar</button>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 5 }}>
                                      <button onClick={() => generateReply(lead)} disabled={replyLoading === lead.id} style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', padding: '4px', background: 'none', border: '1px solid rgba(68,170,255,0.2)', color: '#44aaff', cursor: 'pointer', borderRadius: 3 }}>
                                        {replyLoading === lead.id ? '...' : '↗ Resposta IA'}
                                      </button>
                                      <button onClick={() => navigator.clipboard.writeText(lead.handle)} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', padding: '4px 6px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', color: '#5A5E6B', cursor: 'pointer', borderRadius: 3 }}>
                                        @copy
                                      </button>
                                      <button onClick={() => deleteLead(lead.id)} style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', padding: '4px 6px', background: 'none', border: '1px solid rgba(255,68,68,0.15)', color: '#ff6666', cursor: 'pointer', borderRadius: 3 }}>
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {stageLeads.length === 0 && (
                          <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#3A3E4A', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                            Arrasta um lead<br />para cá
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
