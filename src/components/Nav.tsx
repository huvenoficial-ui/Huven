'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/videos', label: 'Vídeos' },
  { href: '/comments', label: 'Comentários' },
  { href: '/generator', label: 'Gerador' },
  { href: '/competitors', label: 'Concorrentes' },
  { href: '/growth', label: 'Crescimento' },
]

export default function Nav({ videoCount = 0 }: { videoCount?: number }) {
  const path = usePathname()
  return (
    <nav style={{
      height: 56, display: 'flex', alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: '#080808', padding: '0 1.5rem',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
        letterSpacing: '0.15em', color: '#FFE500',
        paddingRight: '1rem', marginRight: '0.5rem',
        borderRight: '1px solid rgba(255,255,255,0.07)'
      }}>HUVEN</div>

      <div style={{ display: 'flex', flex: 1 }}>
        {links.map(l => {
          const active = path === l.href
          return (
            <Link key={l.href} href={l.href} style={{
              fontFamily: 'DM Mono, monospace', fontSize: '0.6rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '0.45rem 1rem', textDecoration: 'none',
              color: active ? '#FFE500' : '#666',
              borderBottom: active ? '2px solid #FFE500' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{l.label}</Link>
          )
        })}
      </div>

      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: '0.58rem',
        color: '#FFE500', background: 'rgba(255,229,0,0.07)',
        border: '1px solid rgba(255,229,0,0.25)',
        padding: '0.2rem 0.7rem', letterSpacing: '0.1em'
      }}>
        {videoCount} vídeo{videoCount !== 1 ? 's' : ''} analisado{videoCount !== 1 ? 's' : ''}
      </div>
    </nav>
  )
}
