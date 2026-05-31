'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import HuvenLogo from '@/components/HuvenLogo'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess('Conta criada! Verifica o teu e-mail para confirmar.'); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0E12', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', gap: 16 }}>
          <HuvenLogo size={56} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.03em', color: '#F0EDE8' }}>HUVEN</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#5A5E6B', textTransform: 'uppercase', marginTop: 4 }}>Sistema de Identidade Velocity</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '2rem' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.5rem' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }} style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em',
                textTransform: 'uppercase', padding: '0.5rem',
                color: tab === t ? '#C9A24A' : '#5A5E6B',
                borderBottom: `2px solid ${tab === t ? '#C9A24A' : 'transparent'}`,
                marginBottom: -1
              }}>
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tab === 'register' && (
              <div>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Nome</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Teu nome" required
                  style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', padding: '0.7rem 0.9rem', borderRadius: 4, outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="teu@email.com" required
                style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', padding: '0.7rem 0.9rem', borderRadius: 4, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#5A5E6B', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                style={{ width: '100%', background: '#111318', border: '1px solid rgba(255,255,255,0.07)', color: '#F0EDE8', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', padding: '0.7rem 0.9rem', borderRadius: 4, outline: 'none' }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 4, fontSize: '0.78rem', color: '#ff8888', fontFamily: 'Inter, sans-serif' }}>{error}</div>
            )}
            {success && (
              <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(68,255,136,0.06)', border: '1px solid rgba(68,255,136,0.2)', borderRadius: 4, fontSize: '0.78rem', color: '#44ff88', fontFamily: 'Inter, sans-serif' }}>{success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.9rem',
              letterSpacing: '0.05em', padding: '0.75rem', background: loading ? '#1C1F28' : '#C9A24A',
              color: loading ? '#5A5E6B' : '#0D0E12', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 4, width: '100%'
            }}>
              {loading ? 'Aguarda...' : tab === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: '#3A3E4A', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
          Ao entrar, aceitas os termos de uso e a política de privacidade da HUVEN.<br />
          Os teus dados são protegidos pela LGPD (Lei 13.709/2018).
        </p>
      </div>
    </div>
  )
}
