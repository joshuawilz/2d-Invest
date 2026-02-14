export const metadata = {
  title: '2D Invest',
  description: 'Application de test investissement',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
