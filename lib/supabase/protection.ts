const PROTECTED_PLATFORM_PREFIXES = ['/chalkai', '/arbor', '/settings'] as const

export function isProtectedPlatformPath(pathname: string): boolean {
  return PROTECTED_PLATFORM_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
