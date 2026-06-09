import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CENTIC — Plateforme d\'Inscription',
  description: 'Plateforme de gestion des inscriptions CENTIC — Centre d\'Education aux outils des nouvelles Technologies de l\'Information et de la Communication',
  icons: {
    icon: '/images/logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}