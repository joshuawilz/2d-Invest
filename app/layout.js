import { Inter } from 'next/font/google'
import './globals.css'

// OPTIMISATION NATIVE DES POLICES : Chargement local, compression variable, zéro latence réseau, zéro clignotement
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: '2D Invest | Excellence en Investissement',
  description: 'Gérez vos actifs et suivez vos profits en temps réel.',
}

// CONFIGURATION DU VIEWPORT : Verrouillage absolu du zoom utilisateur pour éliminer l'effet de rebond sur mobile et le zoom auto lors du focus sur les inputs
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable} style={{ background: '#000', scrollbarWidth: 'none' }}>
      <head>
        {/* Métadonnées avancées pour une immersion PWA de niveau application bancaire native */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'var(--font-inter), sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        overflowX: 'hidden',
        width: '100%',
        minHeight: '100vh',
        WebkitTapHighlightColor: 'transparent',
      }}>
        <main style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}