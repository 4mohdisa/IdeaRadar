/**
 * Supabase Server Client
 * 
 * Use this client for server-side operations (API routes, Server Actions).
 * Integrates with Clerk authentication for secure database access.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Server client with Clerk authentication
 * Use for: authenticated API routes, server actions
 * 
 * @param getToken - Async function that returns Clerk session token
 */
export function createServerClient(
  getToken: () => Promise<string | null>
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      const token = await getToken()
      return token ?? ''
    },
  })
}

/**
 * Admin client with service role (bypasses RLS)
 * Use ONLY for: webhooks, cron jobs, admin operations
 * NEVER expose to client-side code
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

// Singleton admin client
let adminClient: SupabaseClient<Database> | null = null

/**
 * Get singleton admin client
 * Use sparingly - bypasses all RLS policies
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createAdminClient()
  }
  return adminClient
}
