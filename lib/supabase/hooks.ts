/**
 * Supabase Client Hooks
 * 
 * React hooks for using Supabase with Clerk authentication
 * in client components.
 */

'use client'

import { useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Hook to get an authenticated Supabase client
 * Uses Clerk's getToken to authenticate requests
 * 
 * Based on Clerk docs: https://clerk.com/docs/integrations/databases/supabase
 */
export function useSupabaseClient(): SupabaseClient<Database> {
  const { getToken } = useAuth()

  const client = useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      async accessToken() {
        return (await getToken()) ?? null
      },
    })
  }, [getToken])

  return client
}

/**
 * Hook to get an anonymous Supabase client (for public data)
 */
export function useSupabaseAnonymousClient(): SupabaseClient<Database> {
  const client = useMemo(() => {
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  return client
}
