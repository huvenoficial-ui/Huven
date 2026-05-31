import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HUVEN — Sistema Viral',
  description: 'Plataforma de inteligência de conteúdo para criadores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
