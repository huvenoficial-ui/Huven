import { supabaseAdmin } from '@/lib/supabase'
import Nav from '@/components/Nav'
import Link from 'next/link'

export const revalidate = 60

async function getData() {
  const [{ data: videos }, { data: comments }, { data: patterns }] = await Promise.all([
    supabaseAdmin.from('videos').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('comments').select('*').eq('category', 'lead'),
    supabaseAdmin.from('patterns').select('*').order('frequency', { ascending: false }).limit(8),
  ])
  return { videos: videos || [], comments: comments || [], patterns: patterns || [] }
}

export default async function Dashboard() {
  const { videos, comments, patterns } = await getData()
  const avgScore = videos.length > 0
    ? (videos.reduce((a: number, v: any) => a + (v.viral_score || 0), 0) / videos.length).toFixed(1)
    : '—'

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav videoCount={videos.length} />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', color: '#F0EDE8' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#5A5E6B', marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>@huven.oficial</p>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Score viral médio', value: avgScore, sub: `${videos.length} vídeos` },
            { label: 'Leads identificados', value: comments.length, sub: 'este mês' },
            { label: 'Padrões aprendidos', value: patterns.length, sub: 'detectados' },
            { label: 'Vídeos analisados', value: videos.length, sub: 'total' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '1rem 1.2rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, letterSpacing: '-0.02em', color: '#C9A24A' }}>{m.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#5A5E6B', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Top Videos */}
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
              Últimos vídeos analisados
            </div>
            {videos.length === 0 ? (
              <div style={{ color: '#5A5E6B', fontSize: '0.85rem', padding: '1rem 0', fontFamily: 'Inter, sans-serif' }}>
                Nenhum vídeo ainda. <Link href="/videos" style={{ color: '#C9A24A' }}>Fazer upload →</Link>
              </div>
            ) : videos.slice(0, 4).map((v: any) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#F0EDE8', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, fontFamily: 'Inter, sans-serif' }}>
                    {v.gancho || v.filename}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif' }}>{v.tema}</div>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 500,
                  padding: '2px 8px', borderRadius: 999,
                  background: v.viral_score >= 8 ? 'rgba(68,255,136,0.1)' : v.viral_score >= 6 ? 'rgba(201,162,74,0.1)' : 'rgba(255,68,68,0.1)',
                  color: v.viral_score >= 8 ? '#44ff88' : v.viral_score >= 6 ? '#C9A24A' : '#ff6666',
                }}>
                  {v.viral_score?.toFixed(1) || '?'}
                </div>
              </div>
            ))}
            <Link href="/videos" style={{ display: 'block', marginTop: 12, fontSize: '0.75rem', color: '#C9A24A', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
              Ver todos →
            </Link>
          </div>

          {/* Patterns */}
          <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.2rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
              Padrões mais virais identificados
            </div>
            {patterns.length === 0 ? (
              <div style={{ color: '#5A5E6B', fontSize: '0.85rem', padding: '1rem 0', fontFamily: 'Inter, sans-serif' }}>
                Analise vídeos para descobrir padrões.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patterns.map((p: any) => (
                  <span key={p.id} style={{
                    fontSize: '0.72rem', padding: '4px 10px',
                    borderRadius: 6, border: '1px solid rgba(201,162,74,0.25)',
                    background: 'rgba(201,162,74,0.07)', color: '#C9A24A',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {p.name} {p.frequency > 1 ? `(${p.frequency}x)` : ''}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, padding: '0.9rem', background: 'rgba(201,162,74,0.05)', border: '1px solid rgba(201,162,74,0.2)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
                Próximo post recomendado
              </div>
              <Link href="/generator" style={{ textDecoration: 'none' }}>
                <div style={{ fontSize: '0.9rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '-0.01em', color: '#F0EDE8', lineHeight: 1.3 }}>
                  Gerar roteiro com IA baseado nos seus padrões →
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
