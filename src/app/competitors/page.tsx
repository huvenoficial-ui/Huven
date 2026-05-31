'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'

const COMPS = [
  { handle: '@alfredosoares_', initials: 'AS', temas: 'gestão, escala, processos, time', gaps: ['fé + negócios', 'paradoxo financeiro', 'vendas ativas'] },
  { handle: '@thiagonigro', initials: 'TN', temas: 'investimento, finanças pessoais, CNPJ', gaps: ['vendas ativas', 'mentalidade de vendedor'] },
  { handle: '@pablomarçal', initials: 'PM', temas: 'motivação, disciplina, acumulação', gaps: ['técnica de vendas', 'PME específico', 'método'] },
]

const OPPORTUNITIES = ['vendas para PME com fé','paradoxo financeiro empresarial','técnica + espiritualidade','precificação como valor','liderança sem gestão tradicional','vendas ativas para serviços','sócio e conflito de identidade']

export default function CompetitorsPage() {
  const [newHandle, setNewHandle] = useState('')
  const [comps, setComps] = useState(COMPS)
  const [analyzing, setAnalyzing] = useState(false)

  const addComp = async () => {
    if (!newHandle.trim()) return
    setAnalyzing(true)
    setTimeout(() => {
      setComps(prev => [...prev, {
        handle: newHandle.startsWith('@') ? newHandle : '@' + newHandle,
        initials: newHandle.replace('@','').slice(0,2).toUpperCase(),
        temas: 'Analisando...',
        gaps: []
      }])
      setNewHandle('')
      setAnalyzing(false)
    }, 2000)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}>Concorrentes</h1>
            <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>IA mapeia temas e identifica gaps automaticamente</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newHandle} onChange={e => setNewHandle(e.target.value)} placeholder="@handle do concorrente" style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', padding: '0.6rem 0.9rem', outline: 'none', width: 220, borderRadius: 4 }} onKeyDown={e => e.key === 'Enter' && addComp()} />
            <button onClick={addComp} disabled={analyzing} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', padding: '0 1.2rem', background: '#C9A24A', color: '#0D0E12', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
              {analyzing ? '...' : '+ ADICIONAR'}
            </button>
          </div>
        </div>

        <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginBottom: 16 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Perfis monitorados</div>
          {comps.map(c => (
            <div key={c.handle} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#5A5E6B', flexShrink: 0, fontFamily: 'Space Grotesk, sans-serif' }}>{c.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>{c.handle}</div>
                <div style={{ fontSize: '0.78rem', color: '#5A5E6B', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Temas: {c.temas}</div>
                {c.gaps.length > 0 && (
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#5A5E6B', letterSpacing: '0.15em', textTransform: 'uppercase', marginRight: 6 }}>Gaps detectados:</span>
                    {c.gaps.map(g => (
                      <span key={g} style={{ display: 'inline-block', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(201,162,74,0.07)', border: '1px solid rgba(201,162,74,0.2)', color: '#C9A24A', marginRight: 4, marginTop: 2, fontFamily: 'Inter, sans-serif' }}>{g}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
            {OPPORTUNITIES.length} temas que nenhum concorrente domina — oportunidade sua
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {OPPORTUNITIES.map(o => (
              <span key={o} style={{ fontSize: '0.78rem', padding: '5px 12px', border: '1px solid rgba(201,162,74,0.25)', background: 'rgba(201,162,74,0.05)', color: '#C9A24A', borderRadius: 4, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{o}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
