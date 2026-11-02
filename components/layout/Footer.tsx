import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { CookiePrefsButton } from '@/components/legal/CookiePrefsButton'

export function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border mt-auto">
      <Divider className="my-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="font-heading text-2xl text-accent-cream tracking-widest uppercase">
              Saf<span className="text-red-primary">ree</span>
            </span>
            <p className="text-text-muted text-sm mt-3 leading-relaxed">
              The premium marketplace for outdoor gear, hunting grounds, and fishing lodges across Texas and beyond.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-text-primary text-sm mb-4 tracking-wider">Explore</h4>
            <ul className="space-y-2">
              {[['Marketplace', '/products'], ['Experiences', '/experiences'], ['Find Grounds', '/map']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-text-muted text-sm hover:text-accent-cream transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-text-primary text-sm mb-4 tracking-wider">Sell</h4>
            <ul className="space-y-2">
              {[['Become a Seller', '/register'], ['Store Dashboard', '/store'], ['Pricing', '/pricing']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-text-muted text-sm hover:text-accent-cream transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-text-primary text-sm mb-4 tracking-wider">Legal & Support</h4>
            <ul className="space-y-2">
              {[
                ['Help Center', '/help'],
                ['Terms of Service', '/terms'],
                ['Privacy Policy', '/privacy'],
                ['Community Standards', '/moderation-policy'],
                ['Cancellation Policy', '/cancellation-policy'],
                ['Dispute Policy', '/dispute-policy'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-text-muted text-sm hover:text-accent-cream transition-colors">{label}</Link>
                </li>
              ))}
              <li><CookiePrefsButton /></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} Safree LLC. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">Texas-based. Built for the outdoors.</p>
        </div>
      </div>
    </footer>
  )
}
