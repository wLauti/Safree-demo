'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useCartStore } from '@/store/cartStore'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/search/SearchBar'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { role } = useRole()
  const itemCount = useCartStore(s => s.itemCount)
  const openDrawer = useCartStore(s => s.openDrawer)
  const { mobileMenuOpen, toggleMobileMenu } = useUIStore()

  const getDashboardHref = () => {
    switch (role) {
      case 'admin': return '/admin'
      case 'moderator': return '/moderator'
      case 'store': return '/store'
      default: return '/user'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-primary border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="font-heading text-2xl text-accent-cream tracking-widest uppercase">
              Saf<span className="text-red-primary">ree</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-5 flex-shrink-0">
            <Link href="/products" className="text-text-muted hover:text-text-primary font-body text-sm transition-colors whitespace-nowrap">
              Marketplace
            </Link>
            <Link href="/experiences" className="text-text-muted hover:text-text-primary font-body text-sm transition-colors whitespace-nowrap">
              Experiences
            </Link>
            <Link href="/map" className="text-text-muted hover:text-text-primary font-body text-sm transition-colors whitespace-nowrap">
              Find Grounds
            </Link>
          </nav>

          {/* Search bar — grows to fill space */}
          <div className="flex-1 hidden md:block">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <NotificationBell />
                <button
                  onClick={openDrawer}
                  className="relative text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-primary text-accent-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {itemCount()}
                    </span>
                  )}
                </button>
                <Link href={getDashboardHref()}>
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    name={user.user_metadata?.full_name ?? user.email}
                    size="sm"
                  />
                </Link>
                <button
                  onClick={signOut}
                  className="hidden lg:block text-sm text-text-muted hover:text-text-primary transition-colors font-body"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                {/* Guest cart icon */}
                <button
                  onClick={openDrawer}
                  className="relative text-text-muted hover:text-text-primary transition-colors p-1"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-primary text-accent-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {itemCount()}
                    </span>
                  )}
                </button>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Join Free</Button>
                </Link>
              </>
            )}
            <button
              className="lg:hidden text-text-muted hover:text-text-primary p-1"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-bg-secondary">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <Link href="/products" className="text-text-primary font-body" onClick={toggleMobileMenu}>Marketplace</Link>
            <Link href="/experiences" className="text-text-primary font-body" onClick={toggleMobileMenu}>Experiences</Link>
            <Link href="/map" className="text-text-primary font-body" onClick={toggleMobileMenu}>Find Grounds</Link>
            {!user && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Link href="/login" onClick={toggleMobileMenu}><Button variant="ghost" className="w-full">Sign in</Button></Link>
                <Link href="/register" onClick={toggleMobileMenu}><Button variant="primary" className="w-full">Join Free</Button></Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
