'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'

type Category = 'lead' | 'objection' | 'engagement' | 'ignore'

interface Comment {
  id: string
  handle: string
  text: string
  category: Category
  score: number
  reply?: string
  post?: string
}

const SAMPLE: Comment[] = [
  { id: '1', handle: '@marcelooliveira_', text: 'Quanto custa sua mentoria? Preciso muito disso', category: 'lead', score: 9.2, post: 'Todo rico é endividado' },
  { id: '2', handle: '@fernanda.vendas', text: 'Como funciona o HUVEN PRO? Tenho uma equipe de 8 pessoas', category: 'lead', score: 8.8, post: 'Empresário que não vende' },
  { id: '3', handle: '@joaosilva_rn', text: 'Isso não funciona pra negócio pequeno não', category: 'objection', score: 6.1, post: 'Todo rico é endividado' },
  { id: '4', handle: '@ana_empreende', text: 'Já tentei várias mentorias e nenhuma resolveu', category: 'objection', score: 5.4, post: 'Cobrar barato é covardia' },
  { id: '5', handle: '@pedro_mkt', text: 'Que vídeo incrível! Salvei aqui', category: 'engagement', score: 3.2, post: 'Todo rico é endividado' },
  { id: '6', handle: '@carla.negocios', text: 'Mandei pra meu sócio agora mesmo kkk', category: 'engagement', score: 4.1, post: 'Empresário que não vende' },
  { id: '7', handle: '@usuario123', text: 'kkkkkkk', category: 'ignore', score: 0.5, post: 'Todo rico é endividado' },
]

const COLS: { key: Category; label: string; color: string; bg: string }[] = [
  { key: 'lead', label: 'Lead quente', color: '#44ff88', bg: 'rgba(68,255,136,0.04)' },
  { key: 'objection', label: 'Objeção', color: '#C9A24A', bg: 'rgba(201,162,74,0.04)' },
  { key: 'engagement', label: 'Engajamento', color: '#44aaff', bg: 'rgba(68,170,255,0.04)' },
  { key: 'ignore', label: 'Ignorar', color: '#5A5E6B', bg: 'rgba(255,255,255,0.02)' },
]

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>(SAMPLE)
  const [input, setInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [replyId, setReplyId] = useState<string | null>(null)

  const analyzeComments = async () => {
    if (!input.trim()) return
    setAnalyzing(true)
    const lines = input.split('\n').filter(l => l.trim())
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: lines })
      })
      const data = await res.json()
      setComments(prev => [...data.classified, ...prev])
      setInput('')
    } catch (e) { console.error(e) }
    setAnalyzing(false)
  }

  const generateReply = async (comment: Comment) => {
    setReplyId(comment.id)
    try {
      const res = await fetch('/api/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.text, category: comment.category, handle: comment.handle })
      })
      const data = await res.json()
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, reply: data.reply } : c))
    } catch (e) { console.error(e) }
    setReplyId(null)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 1200, margin: '0 auto 1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Comentários — Kanban</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>IA classifica automaticamente em leads, objeções e engajamento</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Cole comentários aqui (um por linha)..."
              style={{
                background: '#161920', border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                padding: '0.6rem 0.9rem', outline: 'none', width: 280, height: 72, resize: 'none', borderRadius: 4
              }}
            />
            <button onClick={analyzeComments} disabled={analyzing || !input.trim()} style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em',
              padding: '0 1.2rem', background: analyzing ? '#1C1F28' : '#C9A24A',
              color: analyzing ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: 'pointer', alignSelf: 'stretch', borderRadius: 4
            }}>
              {analyzing ? 'ANALISANDO...' : '⚡ CLASSIFICAR'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 1200, margin: '0 auto' }}>
          {COLS.map(col => {
            const colComments = comments.filter(c => c.category === col.key)
            return (
              <div key={col.key} style={{ background: col.bg, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 10, minHeight: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.18em', color: col.color }}>{col.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '1px 7px' }}>{colComments.length}</div>
                </div>
                {colComments.map(c => (
                  <div key={c.id} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '9px 10px', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>{c.handle}</div>
                    <div style={{ fontSize: '0.78rem', color: '#5A5E6B', lineHeight: 1.45, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{c.text}</div>
                    {c.post && <div style={{ fontSize: '0.65rem', color: '#3A3E4A', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>→ {c.post}</div>}
                    {col.key !== 'ignore' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.65rem', color: col.color, fontFamily: 'JetBrains Mono, monospace' }}>Temp: {c.score.toFixed(1)}/10</div>
                        <button onClick={() => generateReply(c)} disabled={replyId === c.id} style={{
                          fontSize: '0.65rem', color: '#44aaff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif'
                        }}>
                          {replyId === c.id ? 'Gerando...' : '↗ Responder com IA'}
                        </button>
                      </div>
                    )}
                    {c.reply && (
                      <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(68,170,255,0.06)', border: '1px solid rgba(68,170,255,0.15)', borderRadius: 4, fontSize: '0.75rem', color: '#88bbff', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#44aaff', marginBottom: 3 }}>RESPOSTA SUGERIDA:</div>
                        {c.reply}
                        <button onClick={() => navigator.clipboard.writeText(c.reply!)} style={{ display: 'block', marginTop: 4, fontSize: '0.6rem', color: '#44aaff', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif' }}>Copiar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
