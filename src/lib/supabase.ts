import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient as createSSRClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { cookies } from 'next/headers'

// Get environment variables safely
const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY

// Browser client
export const createBrowserSupabase = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }

  return createBrowserClient<Database>(url, key)
}

// Server client (for Server Components, Route Handlers, Server Actions)
export const createServerSupabase = async () => {
  const cookieStore = await cookies()
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }

  return createSSRClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}

// Admin client (bypasses RLS - use carefully)
export const createAdminSupabase = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient<Database>(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

// Legacy export for backward compatibility - lazy initialization
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = () => {
  if (!supabaseInstance) {
    const url = getSupabaseUrl()
    const key = getSupabaseAnonKey()

    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    }

    supabaseInstance = createClient<Database>(url, key)
  }

  return supabaseInstance
}

export default supabase
