import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl font-semibold text-stone-200 mb-4">404</div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">Page not found</h1>
        <p className="text-sm text-stone-500 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
