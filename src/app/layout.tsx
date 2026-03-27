import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Lobstack Outreach', description: 'B2B Cold Email System' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{margin:0}}>{children}</body></html>
}
