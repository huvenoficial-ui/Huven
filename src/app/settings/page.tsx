'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [connection, setConnection] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const igSuccess = searchParams.get('ig_success')
  const igUser = searchParams.get('ig_user')
  const igError = searchParams.get('ig_error')

  useEffect(() => {
    supabase.from('instagram_connections').select('*').order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => setConnection(data))
  }, [igSuccess])

  const sync = async () => {
    setSyncing(true); setSyncResult(null)
    const res = await fetch('/api/instagram/sync', { method: 'POST' })
    const data = await res.json()
    setSyncResult(data)
    setSyncing(false)
  }

  const disconnect = async () => {
    if (!connection) return
    await supabase.from('instagram_connections').delete().eq('id', connection.id)
    setConnection(null)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Configurações</h1>
        <p style={{ fontSize: '0.85rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', marginBottom: '2rem' }}>{user?.email}</p>

        {/* Instagram Connection */}
        <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.5rem', marginBottom: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#C9A24A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
            Instagram
          </div>

          {igSuccess && (
            <div style={{ padding: '0.7rem 1rem', background: 'rgba(68,255,136,0.06)', border: '1px solid rgba(68,255,136,0.2)', borderRadius: 6, fontSize: '0.82rem', color: '#44ff88', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>
              ✓ @{igUser} ligado com sucesso!
            </div>
          )}

          {igError && igError !== 'no_business_account' && (
            <div style={{ padding: '0.7rem 1rem', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 6, fontSize: '0.82rem', color: '#ff8888', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>
              Erro: {igError}
            </div>
          )}

          {igError === 'no_business_account' && (
            <div style={{ padding: '0.7rem 1rem', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 6, fontSize: '0.82rem', color: '#ff8888', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>
              Conta Instagram não encontrada. A tua conta precisa de ser do tipo <strong>Business ou Creator</strong> e estar ligada a uma <strong>Página do Facebook</strong>.
            </div>
          )}

          {connection ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,162,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A24A', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                  {connection.instagram_username?.[0]?.toUpperCase() || 'IG'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#F0EDE8', fontFamily: 'Inter, sans-serif' }}>@{connection.instagram_username}</div>
                  <div style={{ fontSize: '0.72rem', color: '#5A5E6B', fontFamily: 'JetBrains Mono, monospace' }}>
                    Ligado · expira {new Date(connection.token_expires_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {syncResult && (
                <div style={{ padding: '0.7rem 1rem', background: syncResult.error ? 'rgba(255,68,68,0.06)' : 'rgba(68,255,136,0.06)', border: `1px solid ${syncResult.error ? 'rgba(255,68,68,0.2)' : 'rgba(68,255,136,0.2)'}`, borderRadius: 6, fontSize: '0.78rem', color: syncResult.error ? '#ff8888' : '#44ff88', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
                  {syncResult.error ? `Erro: ${syncResult.error}` : `✓ Sincronizado — ${syncResult.followers?.toLocaleString('pt-BR')} seguidores · ${syncResult.comments_imported} comentários importados`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={sync} disabled={syncing} style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                  padding: '0.6rem 1.2rem', background: syncing ? '#1C1F28' : '#C9A24A',
                  color: syncing ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer', borderRadius: 4
                }}>
                  {syncing ? 'Sincronizando...' : '⟳ Sincronizar agora'}
                </button>
                <button onClick={disconnect} style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                  padding: '0.6rem 1rem', background: 'none',
                  border: '1px solid rgba(255,68,68,0.2)', color: '#ff6666', cursor: 'pointer', borderRadius: 4
                }}>
                  Desligar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, marginBottom: 16 }}>
                Liga o teu Instagram Business ou Creator para importar comentários reais, métricas de crescimento e sincronizar dados automaticamente.
              </p>
              <a href="/api/instagram/auth" style={{
                display: 'inline-block', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                padding: '0.7rem 1.4rem', background: '#C9A24A', color: '#0D0E12',
                textDecoration: 'none', borderRadius: 4
              }}>
                Ligar Instagram →
              </a>
            </div>
          )}
        </div>

        {/* Requirements notice */}
        <div style={{ background: 'rgba(201,162,74,0.04)', border: '1px solid rgba(201,162,74,0.15)', borderRadius: 8, padding: '1rem 1.2rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#C9A24A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Requisitos</div>
          <ul style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.8, paddingLeft: '1.2rem' }}>
            <li>Conta Instagram do tipo <strong style={{ color: '#F0EDE8' }}>Business ou Creator</strong></li>
            <li>Ligada a uma <strong style={{ color: '#F0EDE8' }}>Página do Facebook</strong></li>
            <li>A app Meta deve estar em <strong style={{ color: '#F0EDE8' }}>modo Live</strong> ou a tua conta como testador</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
