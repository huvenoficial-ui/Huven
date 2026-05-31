'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LgpdBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('huven_lgpd_consent')) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('huven_lgpd_consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: '#161920', borderTop: '1px solid rgba(201,162,74,0.2)',
      padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'
    }}>
      <p style={{ fontSize: '0.78rem', color: '#5A5E6B', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, maxWidth: 700 }}>
        Esta plataforma armazena dados de análise de conteúdo (vídeos, comentários e métricas do Instagram) para uso exclusivo da sua conta, conforme a{' '}
        <strong style={{ color: '#F0EDE8' }}>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
        Os dados não são partilhados com terceiros. Ao continuar, aceitas os nossos termos.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={accept} style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.8rem',
          padding: '0.5rem 1.2rem', background: '#C9A24A', color: '#0D0E12',
          border: 'none', cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap'
        }}>
          Aceitar e continuar
        </button>
      </div>
    </div>
  )
}
