import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Lobstack Outreach', description: 'B2B Cold Email System — Lobstack.ai' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet" />
        <link rel="icon" href="https://lobstack.ai/newlogo.png" type="image/png" />
      </head>
      <body style={{margin:0, background:'#f4f4f4', fontFamily:"'Inter',sans-serif"}}>{children}</body>
    </html>
  )
}
