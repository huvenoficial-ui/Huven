'use client'
import { useState, useCallback } from 'react'
import Nav from '@/components/Nav'

interface VideoAnalysis {
  tema: string
  gancho: string
  estrutura: string
  producao: string
  potencial: { score: number; motivo: string }
  pilares: { choque: number; divisao: number; salvamento: number; compartilhamento: number }
  padroes: string[]
  insights: string
}

interface QueueItem {
  id: string
  file: File
  status: 'pending' | 'analyzing' | 'done' | 'error'
  analysis?: VideoAnalysis
  error?: string
}

export default function VideosPage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  const handleFiles = useCallback((files: FileList) => {
    const newItems: QueueItem[] = [...files].filter(f => f.type.startsWith('video/')).map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: 'pending'
    }))
    setQueue(prev => [...prev, ...newItems])
  }, [])

  const extractFrames = async (file: File, count = 4): Promise<string[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const video = document.createElement('video')
        video.muted = true
        video.playsInline = true
        video.src = e.target?.result as string
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const frames: string[] = []

        video.onloadeddata = async () => {
          const duration = video.duration
          if (!duration || isNaN(duration)) { resolve(frames); return }
          const times = Array.from({ length: count }, (_, i) => (duration * (i + 0.5)) / count)
          for (const t of times) {
            await new Promise<void>((done) => {
              let settled = false
              const finish = () => {
                if (settled) return; settled = true
                canvas.width = video.videoWidth || 480
                canvas.height = video.videoHeight || 854
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const b64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1]
                if (b64?.length > 500) frames.push(b64)
                done()
              }
              const timer = setTimeout(finish, 2000)
              video.onseeked = () => { clearTimeout(timer); setTimeout(finish, 80) }
              try { video.currentTime = t } catch { clearTimeout(timer); done() }
            })
          }
          resolve(frames)
        }
        video.onerror = () => resolve(frames)
        video.load()
      }
      reader.readAsDataURL(file)
    })
  }

  const analyzeAll = async () => {
    setAnalyzing(true)
    for (const item of queue.filter(q => q.status === 'pending')) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'analyzing' } : q))
      try {
        const frames = await extractFrames(item.file)
        if (frames.length === 0) throw new Error('Não foi possível extrair frames')

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frames, filename: item.file.name })
        })
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const analysis: VideoAnalysis = await res.json()

        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done', analysis } : q))
      } catch (e: any) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: e.message } : q))
      }
    }
    setAnalyzing(false)
  }

  const pending = queue.filter(q => q.status === 'pending').length
  const done = queue.filter(q => q.status === 'done').length

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav videoCount={done} />
      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.04em' }}>Análise de Vídeos</h1>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>A IA aprende padrões virais de cada vídeo analisado</p>
          </div>
          {pending > 0 && (
            <button onClick={analyzeAll} disabled={analyzing} style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.12em',
              padding: '0.7rem 1.5rem', background: analyzing ? '#1a1a1a' : '#FFE500',
              color: analyzing ? '#555' : '#080808', border: 'none', cursor: analyzing ? 'not-allowed' : 'pointer'
            }}>
              {analyzing ? 'ANALISANDO...' : `⚡ ANALISAR ${pending} VÍDEO${pending > 1 ? 'S' : ''}`}
            </button>
          )}
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('fileInput')?.click()}
          style={{
            border: '2px dashed rgba(255,255,255,0.12)', padding: '2.5rem 2rem',
            textAlign: 'center', cursor: 'pointer', background: '#101010',
            borderRadius: 8, marginBottom: '1.5rem', transition: 'all 0.2s'
          }}
        >
          <input id="fileInput" type="file" accept="video/*" multiple style={{ display: 'none' }}
            onChange={e => e.target.files && handleFiles(e.target.files)} />
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#FFE500', lineHeight: 1 }}>▶</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.06em', margin: '0.6rem 0 0.3rem' }}>
            Solte os vídeos aqui ou clique para selecionar
          </div>
          <div style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.6 }}>
            MP4, MOV — Reels virais que você quer que a IA aprenda
          </div>
        </div>

        {/* Queue */}
        {queue.map(item => (
          <div key={item.id}>
            <div style={{
              background: '#141414', border: '1px solid rgba(255,255,255,0.07)',
              padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: item.analysis ? 0 : 8, borderBottom: item.analysis ? 'none' : undefined
            }}>
              <div style={{
                width: 44, height: 44, background: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '1.2rem'
              }}>▶</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.file.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#555', fontFamily: 'DM Mono, monospace' }}>
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.file.type}
                </div>
              </div>
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '3px 10px', border: '1px solid',
                borderColor: item.status === 'done' ? 'rgba(68,255,136,0.3)' : item.status === 'error' ? 'rgba(255,68,68,0.3)' : item.status === 'analyzing' ? 'rgba(255,229,0,0.3)' : 'rgba(255,255,255,0.07)',
                color: item.status === 'done' ? '#44ff88' : item.status === 'error' ? '#ff6666' : item.status === 'analyzing' ? '#FFE500' : '#555',
              }}>
                {item.status === 'done' ? 'ANALISADO ✓' : item.status === 'error' ? 'ERRO' : item.status === 'analyzing' ? 'ANALISANDO...' : 'AGUARDANDO'}
              </div>
            </div>

            {item.analysis && (
              <div style={{
                background: '#101010', border: '1px solid rgba(255,255,255,0.07)',
                borderTop: 'none', padding: '1.2rem', marginBottom: 8
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Gancho</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.04em', lineHeight: 1.2, marginBottom: 12 }}>{item.analysis.gancho}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Tema</div>
                    <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 12 }}>{item.analysis.tema}</div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Padrões detectados</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.analysis.padroes?.map(p => (
                        <span key={p} style={{ fontSize: '0.7rem', padding: '2px 8px', border: '1px solid rgba(255,229,0,0.25)', background: 'rgba(255,229,0,0.07)', color: '#FFE500', borderRadius: 4 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Score viral — {item.analysis.potencial?.score}/10
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                      {Object.entries(item.analysis.pilares || {}).map(([k, v]) => (
                        <div key={k} style={{ background: '#141414', padding: '8px 10px', textAlign: 'center', borderRadius: 4 }}>
                          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#FFE500' }}>{v as number}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#FFE500', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Insight estratégico</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>{item.analysis.insights}</div>
                  </div>
                </div>
              </div>
            )}

            {item.error && (
              <div style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', borderTop: 'none', padding: '0.75rem 1.2rem', fontSize: '0.78rem', color: '#ff8888', marginBottom: 8 }}>
                {item.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
