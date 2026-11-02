import type { Metadata } from 'next'
import '@/styles/globals.css'
import { NotificationProvider } from '@/components/ui/Notification'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CookieConsent } from '@/components/legal/CookieConsent'
import { SentryInit } from '@/components/SentryInit'

export const metadata: Metadata = {
  title: { default: 'Safree — Premium Outdoor Marketplace', template: '%s — Safree' },
  description: 'Discover hunting grounds, fishing lodges, and premium outdoor gear across Texas.',
  keywords: ['hunting', 'fishing', 'outdoor gear', 'Texas hunting', 'hunting grounds'],
  openGraph: {
    title: 'Safree — Premium Outdoor Marketplace',
    description: 'Discover hunting grounds, fishing lodges, and premium outdoor gear.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased">
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="fixed bottom-3 left-3 z-[60] pointer-events-none select-none rounded-full bg-red-primary/90 text-accent-cream text-[10px] font-heading tracking-widest uppercase px-3 py-1 shadow-card">
            Demo
          </div>
        )}
        {children}
        <CartDrawer />
        <NotificationProvider />
        <CookieConsent />
        <SentryInit />
      </body>
    </html>
  )
}
