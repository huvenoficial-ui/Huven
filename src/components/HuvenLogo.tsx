interface HuvenLogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export default function HuvenLogo({ size = 32, showWordmark = false }: HuvenLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showWordmark ? 10 : 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Left elevation — white diagonal */}
        <polygon points="14,93 27,93 44,12 31,12" fill="#FFFFFF" />
        {/* Right elevation — white diagonal (mirror) */}
        <polygon points="86,93 73,93 56,12 69,12" fill="#FFFFFF" />
        {/* Gold spine — the axis */}
        <rect x="46.5" y="6" width="7" height="88" fill="#C9A24A" />
      </svg>
      {showWordmark && (
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 700,
          fontSize: size * 0.44,
          letterSpacing: '-0.02em',
          color: '#C9A24A',
          lineHeight: 1,
        }}>
          HUVEN
        </span>
      )}
    </div>
  )
}
