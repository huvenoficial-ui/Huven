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

const TEMAS = [
  'Vendas & Fechamento','Mentalidade Empresarial','Dinheiro & Riqueza',
  'Liderança & Gestão','Fé + Negócios','Mercado Brasileiro',
  'Precificação & Valor','Crescimento & Escala','Prospecção Ativa',
  'Gestão de Equipa','Marketing Digital','Branding Pessoal',
  'Fluxo de Caixa','Negociação','Atendimento ao Cliente',
  'Produtividade do Empresário','Sócios & Conflitos','Erros de Iniciante',
  'Casos de Sucesso','Rotina do Empreendedor','Tema livre'
]
const ESTILOS = ['paradoxo','acusacao','inversao','julgamento','cultural','identidade','provocacao','revelacao']

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
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', overflowY: 'auto', background: '#111318' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.2rem' }}>// Parâmetros</div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tema</label>
            <select value={tema} onChange={e => setTema(e.target.value)} style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', padding: '0.6rem 0.8rem', width: '100%', outline: 'none', borderRadius: 4 }}>
              {TEMAS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Estilo de choque</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ESTILOS.map(e => (
                <div key={e} onClick={() => setEstilos(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.07em',
                  padding: '3px 8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.12s', borderRadius: 3,
                  borderColor: estilos.includes(e) ? 'rgba(201,162,74,0.3)' : 'rgba(255,255,255,0.07)',
                  background: estilos.includes(e) ? 'rgba(201,162,74,0.07)' : 'none',
                  color: estilos.includes(e) ? '#C9A24A' : '#5A5E6B',
                }}>{e}</div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Agressividade — {ag}/5</label>
            <input type="range" min={1} max={5} value={ag} onChange={e => setAg(+e.target.value)} style={{ width: '100%', accentColor: '#C9A24A' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Quantidade — {qtd}</label>
            <input type="range" min={1} max={8} value={qtd} onChange={e => setQtd(+e.target.value)} style={{ width: '100%', accentColor: '#C9A24A' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Contexto extra</label>
            <textarea value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Direção, ângulo, referência..." style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', padding: '0.6rem 0.8rem', width: '100%', outline: 'none', minHeight: 70, resize: 'vertical', borderRadius: 4 }} />
          </div>

          <button onClick={generate} disabled={generating || estilos.length === 0} style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em',
            padding: '0.8rem', width: '100%', background: generating ? '#1C1F28' : '#C9A24A',
            color: generating ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
            borderRadius: 4
          }}>
            {generating ? 'GERANDO...' : '⚡ GERAR'}
          </button>
        </div>

        {/* Output */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {results.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15, textAlign: 'center', gap: 8 }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '4rem', color: '#C9A24A', letterSpacing: '-0.03em', lineHeight: 1 }}>HUVEN</div>
              <div style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>Configure e clique em Gerar</div>
            </div>
          )}

          {results.map((h, idx) => (
            <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#161920', borderRadius: 8 }}>
              <div style={{ padding: '1.1rem 1.3rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 10 }}>{h.texto}</div>

                {/* Score dots */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, padding: '0.6rem', background: '#111318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
                  {Object.entries(h.scores || {}).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#5A5E6B', width: '5rem', flexShrink: 0 }}>{k}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {Array.from({ length: 10 }, (_, i) => (
                          <div key={i} style={{ width: 7, height: 7, border: '1px solid', borderRadius: 1, borderColor: i < (v as number) ? (v as number) >= 8 ? '#44ff88' : '#C9A24A' : 'rgba(255,255,255,0.07)', background: i < (v as number) ? (v as number) >= 8 ? '#44ff88' : '#C9A24A' : 'none' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }}>
                  {['roteiro','ab','legenda'].map(t => (
                    <div key={t} onClick={() => setActiveTab(prev => ({ ...prev, [idx]: t }))} style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                      padding: '0.3rem 0.75rem', cursor: 'pointer',
                      color: tab(idx) === t ? '#C9A24A' : '#5A5E6B',
                      borderBottom: `2px solid ${tab(idx) === t ? '#C9A24A' : 'transparent'}`,
                      marginBottom: -1
                    }}>{t === 'ab' ? 'A/B' : t}</div>
                  ))}
                </div>

                {tab(idx) === 'roteiro' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(h.roteiro || []).map(r => (
                      <div key={r.ato} style={{ display: 'flex', gap: 10, padding: '0.5rem', background: '#111318', borderRadius: 4 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#C9A24A', minWidth: '3.5rem', paddingTop: 2, flexShrink: 0 }}>{r.tempo}</span>
                        <div>
                          <div style={{ fontFamily: 'Inter, monospace', fontSize: '0.6rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 2 }}>{r.ato}</div>
                          <div style={{ fontSize: '0.78rem', color: '#5A5E6B', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{r.instrucao}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab(idx) === 'ab' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(h.variantes || []).map(v => (
                      <div key={v.label} style={{ padding: '0.65rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#44aaff', marginBottom: 4 }}>{v.label}</div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{v.texto}</div>
                      </div>
                    ))}
                  </div>
                )}

                {tab(idx) === 'legenda' && (
                  <div>
                    <div style={{ background: '#111318', padding: '0.8rem', fontSize: '0.8rem', lineHeight: 1.65, whiteSpace: 'pre-line', marginBottom: 8, borderRadius: 4, fontFamily: 'Inter, sans-serif' }}>{h.legenda}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(h.hashtags || []).map(t => (
                        <span key={t} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#C9A24A', background: 'rgba(201,162,74,0.07)', padding: '2px 7px', borderRadius: 3 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => copy(h.texto, `h-${idx}`)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', background: 'none', border: `1px solid ${copied[`h-${idx}`] ? '#44ff88' : 'rgba(255,255,255,0.07)'}`, color: copied[`h-${idx}`] ? '#44ff88' : '#5A5E6B', cursor: 'pointer', borderRadius: 3 }}>
                    {copied[`h-${idx}`] ? 'COPIADO ✓' : 'Copiar headline'}
                  </button>
                  <button onClick={() => copy(`HEADLINE:\n${h.texto}\n\nROTEIRO:\n${(h.roteiro||[]).map(r=>`[${r.tempo}] ${r.ato}: ${r.instrucao}`).join('\n')}\n\nLEGENDA:\n${h.legenda}\n\nHASHTAGS: ${(h.hashtags||[]).join(' ')}`, `all-${idx}`)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', background: 'none', border: `1px solid ${copied[`all-${idx}`] ? '#44ff88' : 'rgba(255,255,255,0.07)'}`, color: copied[`all-${idx}`] ? '#44ff88' : '#5A5E6B', cursor: 'pointer', borderRadius: 3 }}>
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
