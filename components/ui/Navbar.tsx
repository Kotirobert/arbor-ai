'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Route } from 'next'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  teacher: 'Teacher',
  hoy:     'Head of Year',
  slt:     'SLT',
}

const ROLE_COLORS: Record<UserRole, string> = {
  teacher: 'bg-blue-50  text-blue-700',
  hoy:     'bg-amber-50 text-amber-700',
  slt:     'bg-brand-50 text-brand-600',
}

interface NavbarProps {
  role?: UserRole
  schoolName?: string
  lastUpload?: string
  onRoleChange?: (role: UserRole) => void
}

export function Navbar({
  role = 'slt',
  schoolName = 'Greenfield Academy',
  lastUpload,
  onRoleChange,
}: NavbarProps) {
  const pathname = usePathname()

  const NAV_LINKS: { href: Route; label: string }[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload',    label: 'Upload'    },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 h-[52px]">
      <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Logo + nav */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <GridIcon />
            </div>
            <span className="font-semibold text-[15px] text-stone-900">Arbor AI</span>
          </Link>

          <nav className="flex items-center gap-0.5 ml-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {lastUpload && (
            <span className="text-xs text-stone-400 hidden md:block">
              Last import: {lastUpload}
            </span>
          )}

          <span className="text-sm text-stone-500 font-medium hidden md:block">{schoolName}</span>

          {onRoleChange ? (
            <select
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onRoleChange(e.target.value as UserRole)
              }
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                ROLE_COLORS[role],
              )}
            >
              <option value="slt">SLT</option>
              <option value="hoy">Head of Year</option>
              <option value="teacher">Teacher</option>
            </select>
          ) : (
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', ROLE_COLORS[role])}>
              {ROLE_LABELS[role]}
            </span>
          )}

          <Link
            href="/upload"
            className="bg-brand-500 text-white text-sm font-medium px-3.5 py-1.5 rounded-xl hover:bg-brand-600 transition-colors"
          >
            Upload new data
          </Link>
        </div>
      </div>
    </header>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  )
}
