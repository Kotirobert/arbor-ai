import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, test } from 'vitest'

import { getSupabaseEnv, hasSupabaseEnv } from '../config'
import { isProtectedPlatformPath } from '../protection'

describe('Supabase environment helpers', () => {
  test('detects when the public Supabase env vars are configured', () => {
    expect(hasSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    })).toBe(true)
  })

  test('accepts Supabase publishable key env var from the current dashboard', () => {
    expect(getSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    })).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'publishable-key',
    })
  })

  test('rejects missing Supabase env vars', () => {
    expect(hasSupabaseEnv({})).toBe(false)
    expect(() => getSupabaseEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })
})

describe('Supabase route protection', () => {
  test.each([
    ['/chalkai', true],
    ['/chalkai/library', true],
    ['/arbor/dashboard', true],
    ['/settings', true],
    ['/settings/profile', true],
    ['/sign-in', false],
    ['/api/chalkai/chat', false],
    ['/_next/static/chunk.js', false],
  ])('marks %s as protected=%s', (pathname, expected) => {
    expect(isProtectedPlatformPath(pathname)).toBe(expected)
  })
})

describe('Supabase schema', () => {
  const schema = readFileSync(join(process.cwd(), 'supabase', 'schema.sql'), 'utf8')

  test('creates profile and saved resource tables with RLS', () => {
    expect(schema).toContain('create table if not exists public.profiles')
    expect(schema).toContain('create table if not exists public.saved_resources')
    expect(schema).toContain('alter table public.profiles enable row level security')
    expect(schema).toContain('alter table public.saved_resources enable row level security')
  })

  test('limits profile and resource rows to the owning user', () => {
    expect(schema).toContain('(select auth.uid()) = id')
    expect(schema).toContain('(select auth.uid()) = user_id')
  })

  test('creates user memory tables with explicit RLS and soft delete support', () => {
    expect(schema).toContain('create table if not exists public.user_memory_items')
    expect(schema).toContain('create table if not exists public.memory_summaries')
    expect(schema).toContain('deleted_at timestamptz')
    expect(schema).toContain('alter table public.user_memory_items enable row level security')
    expect(schema).toContain('alter table public.memory_summaries enable row level security')
    expect(schema).toContain('create policy "Users select own memory items"')
    expect(schema).toContain('create policy "Users insert own memory items"')
    expect(schema).toContain('create policy "Users update own memory items"')
    expect(schema).toContain('create policy "Users delete own memory items"')
    expect(schema).toContain('create index if not exists user_memory_items_user_kind_updated_idx')
    expect(schema).toContain('create unique index if not exists memory_summaries_user_kind_idx')
  })
})
