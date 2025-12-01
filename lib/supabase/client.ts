/**
 * Supabase Browser Client
 * 
 * Use this client for client-side components.
 * For authenticated requests, use createAuthenticatedClient() with Clerk session.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Anonymous Supabase client for public data access
 * Use for: browsing ideas, viewing public content (no auth required)
 */
export function createBrowserClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Authenticated Supabase client with Clerk session token
 * Use for: voting, commenting, bookmarking, creating ideas (auth required)
 * 
 * @param getToken - Function that returns Clerk session token
 */
export function createAuthenticatedClient(
  getToken: () => Promise<string | null>
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      const token = await getToken()
      return token ?? ''
    },
  })
}

// Singleton instance for anonymous access
let browserClient: SupabaseClient<Database> | null = null

/**
 * Get singleton browser client for anonymous access
 * Prevents creating multiple client instances
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}
