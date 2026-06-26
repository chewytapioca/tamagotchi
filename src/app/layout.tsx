import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'tamago',
  description: 'a kawaii web pet that lives on the server',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: '#faf9f7',
        color: '#1a1a1a',
      }}>
        {children}
      </body>
    </html>
  )
}
