import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 text-center">
      <p className="font-heading text-[6rem] leading-none text-red-primary">404</p>
      <h1 className="font-heading text-2xl text-accent-cream mb-2">Trail not found</h1>
      <p className="text-text-muted max-w-md mb-8">
        The page you&apos;re looking for has wandered off. Let&apos;s get you back to familiar ground.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">Back Home</Link>
        <Link href="/products" className="btn-secondary">Browse Marketplace</Link>
      </div>
    </div>
  )
}
