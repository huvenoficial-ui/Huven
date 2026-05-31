'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'

const generate30d = () => {
  const data = []
  let val = 16200
  for (let i = 0; i < 30; i++) {
    val += Math.round(Math.random() * 120 + 20)
    if (i === 5) val += 743
    if (i === 18) val += 312
    if (i === 24) val += 187
    data.push({ day: i + 1, seguidores: val, label: `${i+1} mai` })
  }
  return data
}

const DATA = generate30d()
const VIRAIS = [
  { day: 6, label: 'Todo rico é endividado', gain: '+743' },
  { day: 19, label: 'Empresário que não vende', gain: '+312' },
  { day: 25, label: 'Cobrar barato é covardia', gain: '+187' },
]

const PROJS = {
  atual: { '30d': '19.2k', '90d': '23.1k', '6m': '31.4k', '1a': '48.7k', taxa: '+7.4%/mês' },
  acelerado: { '30d': '20.8k', '90d': '28.4k', '6m': '42.1k', '1a': '74.3k', taxa: '+12.1%/mês' },
  agressivo: { '30d': '22.1k', '90d': '34.7k', '6m': '58.2k', '1a': '112k', taxa: '+18%/mês' },
}

const COMPS = [
  { handle: '@huven.oficial', initials: 'HU', growth: 7.4, isYou: true },
  { handle: '@alfredosoares_', initials: 'AS', growth: 9.8 },
  { handle: '@thiagonigro', initials: 'TN', growth: 6.1 },
  { handle: '@pablomarçal', initials: 'PM', growth: 5.2 },
]

export default function GrowthPage() {
  const [period, setPeriod] = useState('30d')
  const [proj, setProj] = useState<'atual' | 'acelerado' | 'agressivo'>('atual')
  const [tooltip, setTooltip] = useState<{ day: number; label: string; gain: string } | null>(null)

  const metrics = [
    { label: 'Seguidores', value: '17.4k', delta: '+1.2k este mês', up: true },
    { label: 'Crescimento mensal', value: '+7.4%', delta: '+2.1% vs mês anterior', up: true },
    { label: 'Alcance médio/Reel', value: '42.3k', delta: '+18% vs mês anterior', up: true },
    { label: 'Projeção 90 dias', value: '23.1k', delta: 'no ritmo atual', up: null },
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.04em' }}>Crescimento</h1>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>@huven.oficial · além do Social Blade</p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['7d','30d','90d','1a'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', padding: '4px 10px',
                background: period === p ? 'rgba(255,229,0,0.07)' : 'none',
                border: `1px solid ${period === p ? 'rgba(255,229,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: period === p ? '#FFE500' : '#555', cursor: 'pointer'
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '1rem 1.2rem' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: m.up === null ? '#FFE500' : '#f0f0eb', letterSpacing: '0.04em' }}>{m.value}</div>
              <div style={{ fontSize: '0.7rem', marginTop: 3, color: m.up === true ? '#44ff88' : m.up === false ? '#ff6666' : '#555' }}>{m.delta}</div>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginBottom: 14 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#FFE500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            Seguidores ao longo do tempo
            <span style={{ color: '#555', marginLeft: 12 }}>● pontos = vídeo viral</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.75rem' }} labelStyle={{ color: '#888' }} itemStyle={{ color: '#FFE500' }} formatter={(v: any) => [v.toLocaleString('pt-BR'), 'Seguidores']} />
              <Line type="monotone" dataKey="seguidores" stroke="#FFE500" strokeWidth={1.5} dot={false} />
              {VIRAIS.map(v => (
                <ReferenceDot key={v.day} x={v.day} y={DATA[v.day - 1]?.seguidores} r={5} fill="#FFE500" stroke="#080808" strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {VIRAIS.map(v => (
              <div key={v.day} style={{ fontSize: '0.68rem', color: '#555' }}>
                <span style={{ color: '#FFE500' }}>●</span> dia {v.day}: {v.label} <span style={{ color: '#44ff88' }}>{v.gain} seg</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Top videos */}
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#FFE500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Vídeos que mais geraram seguidores</div>
            {[
              { rank: 1, title: 'Todo rico é endividado...', meta: '23.4k curtidas · há 18 dias', gain: '+743 seg' },
              { rank: 2, title: 'Empresário que não vende...', meta: '11.2k curtidas · há 11 dias', gain: '+312 seg' },
              { rank: 3, title: 'Cobrar barato é covardia...', meta: '7.8k curtidas · há 6 dias', gain: '+187 seg' },
              { rank: 4, title: 'Deus não abençoa preguiça...', meta: '4.1k curtidas · há 3 dias', gain: '+94 seg' },
            ].map(r => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: '#555', minWidth: 20 }}>{r.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f0f0eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{r.title}</div>
                  <div style={{ fontSize: '0.7rem', color: '#555' }}>{r.meta}</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#44ff88', whiteSpace: 'nowrap' }}>{r.gain}</div>
              </div>
            ))}
          </div>

          {/* Projections */}
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#FFE500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Projeções de crescimento</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {(['atual','acelerado','agressivo'] as const).map(p => (
                <button key={p} onClick={() => setProj(p)} style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '3px 8px',
                  background: proj === p ? 'rgba(255,229,0,0.07)' : 'none',
                  border: `1px solid ${proj === p ? 'rgba(255,229,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color: proj === p ? '#FFE500' : '#555', cursor: 'pointer'
                }}>{p}</button>
              ))}
            </div>
            {Object.entries(PROJS[proj]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.82rem', color: '#666' }}>{k === 'taxa' ? 'Taxa de crescimento' : `Em ${k}`}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: proj === 'agressivo' && k !== 'taxa' ? '#FFE500' : '#f0f0eb' }}>{v}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Competitors */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem', marginTop: 14 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#FFE500', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Comparativo — crescimento mensal</div>
          {COMPS.map(c => (
            <div key={c.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.isYou ? 'rgba(255,229,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 500, color: c.isYou ? '#FFE500' : '#555', flexShrink: 0 }}>{c.initials}</div>
              <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: c.isYou ? '#FFE500' : '#f0f0eb' }}>{c.handle} {c.isYou && <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#555' }}>você</span>}</div>
              <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.growth / 10) * 100}%`, background: c.isYou ? '#FFE500' : '#378ADD', borderRadius: 2 }} />
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: c.isYou ? '#FFE500' : '#888', minWidth: 40, textAlign: 'right' }}>+{c.growth}%</div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(68,255,136,0.05)', border: '1px solid rgba(68,255,136,0.15)', borderRadius: 6, fontSize: '0.78rem', color: '#44ff88', lineHeight: 1.5 }}>
            Você está acima de 2 dos 3 concorrentes. Para superar o Alfredo Soares, precisa de +1 vídeo viral por semana com tema de gestão empresarial.
          </div>
        </div>

      </div>
    </div>
  )
}
