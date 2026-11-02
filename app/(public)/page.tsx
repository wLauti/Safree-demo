export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MapPin, Target, Fish, ShieldCheck, Star } from 'lucide-react'
import { IMG } from '@/lib/utils/images'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative bg-bg-primary bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url('${IMG.hero}')` }}
      >
        {/* Dark gradient keeps cream text legible over the photo (left-weighted). */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-40">
          <div className="max-w-3xl">
            <p className="text-label text-red-primary mb-4 tracking-widest">Texas&apos; Premier Outdoor Platform</p>
            <h1 className="text-display text-accent-cream mb-6 leading-none">
              Hunt More.<br />
              <span className="text-red-primary">Worry Less.</span>
            </h1>
            <p className="text-body-lg text-text-muted mb-10 max-w-xl">
              Discover verified hunting grounds, fishing lodges, and premium outdoor gear — all in one place. Built for serious hunters and anglers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/experiences">
                <Button variant="primary" size="lg">Find Hunting Grounds</Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="lg">Shop Gear</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* Feature pillars */}
      <PageWrapper>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          {[
            { icon: <MapPin className="h-8 w-8" />, title: 'Discover Grounds', desc: 'Interactive map of hunting ranches and fishing lodges across Texas with real availability.' },
            { icon: <Target className="h-8 w-8" />, title: 'Book Experiences', desc: 'Vetted outfitters, transparent pricing, and secure booking — no hidden fees.' },
            { icon: <ShieldCheck className="h-8 w-8" />, title: 'Shop Trusted Gear', desc: 'Curated marketplace with verified sellers and buyer protection on every order.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card-base p-8 text-center">
              <div className="text-red-primary mx-auto mb-4 w-fit">{icon}</div>
              <h3 className="font-heading text-xl text-text-primary mb-2">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </PageWrapper>

      <Divider />

      {/* CTA Banner */}
      <section
        className="relative bg-red-primary bg-cover bg-center py-20 overflow-hidden"
        style={{ backgroundImage: `url('${IMG.listLand}')` }}
      >
        {/* Red brand wash over the landscape. */}
        <div className="absolute inset-0 bg-red-dark/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-4xl text-accent-cream mb-4 drop-shadow-lg">Ready to List Your Land?</h2>
          <p className="text-accent-cream/90 text-lg mb-8 max-w-2xl mx-auto drop-shadow">
            Join hundreds of Texas landowners earning from their property. Set your rates, choose your dates, keep full control.
          </p>
          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
              className="bg-accent-cream text-red-primary hover:bg-accent-cream/90 border-transparent"
            >
              Start Listing — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
