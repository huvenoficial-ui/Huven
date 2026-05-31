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
      background: '#0D0E12', padding: '0 1.5rem',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div style={{
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
        fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#C9A24A',
        paddingRight: '1rem', marginRight: '0.5rem',
        borderRight: '1px solid rgba(255,255,255,0.07)'
      }}>HUVEN</div>

      <div style={{ display: 'flex', flex: 1 }}>
        {links.map(l => {
          const active = path === l.href
          return (
            <Link key={l.href} href={l.href} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '0.45rem 1rem', textDecoration: 'none',
              color: active ? '#C9A24A' : '#5A5E6B',
              borderBottom: active ? '2px solid #C9A24A' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{l.label}</Link>
          )
        })}
      </div>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
        color: '#C9A24A', background: 'rgba(201,162,74,0.07)',
        border: '1px solid rgba(201,162,74,0.25)',
        padding: '0.2rem 0.7rem', letterSpacing: '0.1em'
      }}>
        {videoCount} vídeo{videoCount !== 1 ? 's' : ''} analisado{videoCount !== 1 ? 's' : ''}
      </div>
    </nav>
  )
}
