'use client'

import type { ChalkAiSession, TeacherProfile, ChalkAiTool, UserRole } from '@/types'

const SESSION_KEY   = 'chalkai-session'
const PROFILE_KEY   = 'chalkai-profile'
const LAST_TOOL_KEY = 'last-active-tool'

function safeLocal(): Storage | null {
  if (typeof window === 'undefined') return null
  try { return window.localStorage } catch { return null }
}

export function getSession(): ChalkAiSession | null {
  const ls = safeLocal()
  if (!ls) return null
  const raw = ls.getItem(SESSION_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as ChalkAiSession } catch { return null }
}

export function setSession(s: ChalkAiSession): void {
  const ls = safeLocal()
  if (!ls) return
  ls.setItem(SESSION_KEY, JSON.stringify(s))
}

export function signOut(): void {
  const ls = safeLocal()
  if (!ls) return
  ls.removeItem(SESSION_KEY)
  ls.removeItem(PROFILE_KEY)
  ls.removeItem(LAST_TOOL_KEY)
}

export function getProfile(): TeacherProfile | null {
  const ls = safeLocal()
  if (!ls) return null
  const raw = ls.getItem(PROFILE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as TeacherProfile } catch { return null }
}

export function setProfile(p: TeacherProfile): void {
  const ls = safeLocal()
  if (!ls) return
  ls.setItem(PROFILE_KEY, JSON.stringify(p))
}

export function getLastTool(): ChalkAiTool {
  const ls = safeLocal()
  if (!ls) return 'chalkai'
  return (ls.getItem(LAST_TOOL_KEY) as ChalkAiTool) ?? 'chalkai'
}

export function setLastTool(t: ChalkAiTool): void {
  const ls = safeLocal()
  if (!ls) return
  ls.setItem(LAST_TOOL_KEY, t)
}

export function createMockSession(args: {
  email:     string
  firstName: string
  lastName:  string
  role?:     UserRole
}): ChalkAiSession {
  const s: ChalkAiSession = {
    email:      args.email,
    firstName:  args.firstName,
    lastName:   args.lastName,
    role:       args.role ?? 'teacher',
    signedInAt: new Date().toISOString(),
  }
  setSession(s)
  return s
}

export function landingToolFor(role: UserRole): ChalkAiTool {
  return role === 'teacher' ? 'chalkai' : 'arbor'
}
