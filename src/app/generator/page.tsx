'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'

interface Headline {
  texto: string
  scores: { choque: number; divisao: number; salvamento: number; compartilhamento: number }
  roteiro: { ato: string; tempo: string; instrucao: string }[]
  variantes: { label: string; texto: string }[]
  legenda: string
  hashtags: string[]
}

const TEMAS = ['Vendas & Fechamento','Mentalidade Empresarial','Dinheiro & Riqueza','Liderança & Gestão','Fé + Negócios','Mercado Brasileiro','Precificação','Crescimento & Escala','Tema livre']
const ESTILOS = ['paradoxo','acusacao','inversao','julgamento','cultural','identidade']

export default function GeneratorPage() {
  const [tema, setTema] = useState(TEMAS[0])
  const [estilos, setEstilos] = useState(['paradoxo','acusacao'])
  const [ag, setAg] = useState(4)
  const [qtd, setQtd] = useState(3)
  const [contexto, setContexto] = useState('')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<Headline[]>([])
  const [activeTab, setActiveTab] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  const generate = async () => {
    if (estilos.length === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, estilos, agressividade: ag, quantidade: qtd, contexto })
      })
      const data = await res.json()
      setResults(prev => [...(data.headlines || []), ...prev])
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 1500)
  }

  const tab = (idx: number) => activeTab[idx] || 'roteiro'

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 56px)' }}>

        {/* Controls */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.18em', textTransform: 'uppercase', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.2rem' }}>// Parâmetros</div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tema</label>
            <select value={tema} onChange={e => setTema(e.target.value)} style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f0eb', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', padding: '0.6rem 0.8rem', width: '100%', outline: 'none' }}>
              {TEMAS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Estilo de choque</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ESTILOS.map(e => (
                <div key={e} onClick={() => setEstilos(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])} style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.07em',
                  padding: '3px 8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
                  borderColor: estilos.includes(e) ? 'rgba(255,229,0,0.3)' : 'rgba(255,255,255,0.07)',
                  background: estilos.includes(e) ? 'rgba(255,229,0,0.07)' : 'none',
                  color: estilos.includes(e) ? '#FFE500' : '#555',
                }}>{e}</div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Agressividade — {ag}/5</label>
            <input type="range" min={1} max={5} value={ag} onChange={e => setAg(+e.target.value)} style={{ width: '100%', accentColor: '#FFE500' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Quantidade — {qtd}</label>
            <input type="range" min={1} max={8} value={qtd} onChange={e => setQtd(+e.target.value)} style={{ width: '100%', accentColor: '#FFE500' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Contexto extra</label>
            <textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Direção, ângulo, referência..." style={{ background: '#101010', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f0eb', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', padding: '0.6rem 0.8rem', width: '100%', outline: 'none', minHeight: 70, resize: 'vertical' }} />
          </div>

          <button onClick={generate} disabled={generating || estilos.length === 0} style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.12em',
            padding: '0.8rem', width: '100%', background: generating ? '#1a1a1a' : '#FFE500',
            color: generating ? '#555' : '#080808', border: 'none', cursor: generating ? 'not-allowed' : 'pointer'
          }}>
            {generating ? 'GERANDO...' : '⚡ GERAR'}
          </button>
        </div>

        {/* Output */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, textAlign: 'center', gap: 8 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '4rem', color: '#FFE500', letterSpacing: '0.1em', lineHeight: 1 }}>HUVEN</div>
              <div style={{ fontSize: '0.82rem', color: '#555' }}>Configure e clique em Gerar</div>
            </div>
          )}

          {results.map((h, idx) => (
            <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#141414' }}>
              <div style={{ padding: '1.1rem 1.3rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.04em', lineHeight: 1.15, marginBottom: 10 }}>{h.texto}</div>

                {/* Score dots */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, padding: '0.6rem', background: '#101010', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {Object.entries(h.scores || {}).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: '#555', width: '5rem', flexShrink: 0 }}>{k}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {Array.from({ length: 10 }, (_, i) => (
                          <div key={i} style={{ width: 7, height: 7, border: '1px solid', borderColor: i < (v as number) ? (v as number) >= 8 ? '#44ff88' : '#FFE500' : 'rgba(255,255,255,0.07)', background: i < (v as number) ? (v as number) >= 8 ? '#44ff88' : '#FFE500' : 'none' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
                  {['roteiro','ab','legenda'].map(t => (
                    <div key={t} onClick={() => setActiveTab(prev => ({ ...prev, [idx]: t }))} style={{
                      fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '0.3rem 0.75rem', cursor: 'pointer',
                      color: tab(idx) === t ? '#FFE500' : '#555',
                      borderBottom: `2px solid ${tab(idx) === t ? '#FFE500' : 'transparent'}`,
                      marginBottom: -1
                    }}>{t === 'ab' ? 'A/B' : t}</div>
                  ))}
                </div>

                {tab(idx) === 'roteiro' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(h.roteiro || []).map(r => (
                      <div key={r.ato} style={{ display: 'flex', gap: 10, padding: '0.5rem', background: '#101010' }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: '#FFE500', minWidth: '3.5rem', paddingTop: 2, flexShrink: 0 }}>{r.tempo}</span>
                        <div>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', fontWeight: 500, color: '#f0f0eb', marginBottom: 2 }}>{r.ato}</div>
                          <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.5 }}>{r.instrucao}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab(idx) === 'ab' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(h.variantes || []).map(v => (
                      <div key={v.label} style={{ padding: '0.65rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', color: '#44aaff', marginBottom: 4 }}>{v.label}</div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>{v.texto}</div>
                      </div>
                    ))}
                  </div>
                )}

                {tab(idx) === 'legenda' && (
                  <div>
                    <div style={{ background: '#101010', padding: '0.8rem', fontSize: '0.8rem', lineHeight: 1.65, whiteSpace: 'pre-line', marginBottom: 8 }}>{h.legenda}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(h.hashtags || []).map(t => (
                        <span key={t} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', background: 'rgba(255,229,0,0.07)', padding: '2px 7px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => copy(h.texto, `h-${idx}`)} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', background: 'none', border: `1px solid ${copied[`h-${idx}`] ? '#44ff88' : 'rgba(255,255,255,0.07)'}`, color: copied[`h-${idx}`] ? '#44ff88' : '#555', cursor: 'pointer' }}>
                    {copied[`h-${idx}`] ? 'COPIADO ✓' : 'Copiar headline'}
                  </button>
                  <button onClick={() => copy(`HEADLINE:\n${h.texto}\n\nROTEIRO:\n${(h.roteiro||[]).map(r=>`[${r.tempo}] ${r.ato}: ${r.instrucao}`).join('\n')}\n\nLEGENDA:\n${h.legenda}\n\nHASHTAGS: ${(h.hashtags||[]).join(' ')}`, `all-${idx}`)} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', background: 'none', border: `1px solid ${copied[`all-${idx}`] ? '#44ff88' : 'rgba(255,255,255,0.07)'}`, color: copied[`all-${idx}`] ? '#44ff88' : '#555', cursor: 'pointer' }}>
                    {copied[`all-${idx}`] ? 'COPIADO ✓' : 'Copiar tudo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
