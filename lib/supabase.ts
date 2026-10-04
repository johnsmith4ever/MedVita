/**
 * lib/supabase.ts
 *
 * Two Supabase client factories:
 *  - createBrowserClient()  — for Client Components (anon key, no JWT)
 *  - createServerClient()   — for Server Components / API routes, injects the
 *    Clerk JWT so Supabase RLS policies can read auth.jwt()->>'sub' as the user ID.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isConfigured = !!(supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== '' && supabaseAnonKey !== '')

/** Public anon client — safe to use in Client Components */
export const supabaseBrowser = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null

/**
 * Authenticated server client — injects Clerk JWT for RLS.
 * Returns null if Supabase is not configured.
 */
export function createServerClient(clerkToken: string) {
  if (!isConfigured) return null
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    accessToken: async () => clerkToken,
  })
}

/** Service-role client — returns null if not configured */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!isConfigured || !serviceKey) return null
  return createClient(supabaseUrl!, serviceKey, {
    auth: { persistSession: false },
  })
}
