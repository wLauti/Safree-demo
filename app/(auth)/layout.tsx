import Link from 'next/link'
import { IMG } from '@/lib/utils/images'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex flex-col bg-bg-primary bg-cover bg-center"
      style={{ backgroundImage: `url('${IMG.auth}')` }}
    >
      {/* Dark overlay so the auth card and text stay legible over the photo. */}
      <div className="absolute inset-0 bg-bg-primary/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-bg-primary/70" />

      <header className="relative py-6 px-8">
        <Link href="/" className="font-heading text-2xl text-accent-cream tracking-widest uppercase drop-shadow">
          Saf<span className="text-red-primary">ree</span>
        </Link>
      </header>
      <main className="relative flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="relative py-6 text-center text-text-muted text-xs">
        © {new Date().getFullYear()} Safree LLC
      </footer>
    </div>
  )
}
