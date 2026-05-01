type SupabaseEnvSource = Record<string, string | undefined>

export type SupabaseEnv = {
  url: string
  anonKey: string
}

const DEFAULT_SUPABASE_ENV: SupabaseEnvSource = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}

export function hasSupabaseEnv(env: SupabaseEnvSource = DEFAULT_SUPABASE_ENV): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && getPublicSupabaseKey(env))
}

export function getSupabaseEnv(env: SupabaseEnvSource = DEFAULT_SUPABASE_ENV): SupabaseEnv {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = getPublicSupabaseKey(env)

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return { url, anonKey }
}

function getPublicSupabaseKey(env: SupabaseEnvSource): string | undefined {
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
}
