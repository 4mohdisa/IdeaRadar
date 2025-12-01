/**
 * Supabase + Clerk Auth Integration
 * 
 * Helper functions for creating authenticated Supabase clients
 * that work with Clerk authentication.
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Create an authenticated Supabase client for server-side use
 * Uses Clerk's auth() to get the session token
 * 
 * Use in: Server Components, Server Actions, Route Handlers
 * 
 * Based on Clerk docs: https://clerk.com/docs/integrations/databases/supabase
 */
export function createClerkSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      const { getToken } = await auth()
      return (await getToken()) ?? ''
    },
  })
}

/**
 * Get the current user ID from Clerk
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Check if the current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth()
  return !!userId
}

/**
 * Ensure user profile exists in Supabase
 * Creates profile if it doesn't exist (fallback for webhook)
 * Uses admin client to bypass RLS
 */
export async function ensureUserProfile(): Promise<{ userId: string | null; error: Error | null }> {
  const user = await currentUser()
  
  if (!user) {
    return { userId: null, error: null }
  }

  // Create admin client directly to avoid circular dependency
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Check if profile exists
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    return { userId: user.id, error: null }
  }

  // Profile doesn't exist, create it
  const primaryEmail = user.emailAddresses.find(
    email => email.id === user.primaryEmailAddressId
  )?.emailAddress

  if (!primaryEmail) {
    return { userId: null, error: new Error('No primary email found') }
  }

  // Use upsert to handle potential race conditions
  const { error } = await adminClient
    .from('profiles')
    .upsert({
      id: user.id,
      email: primaryEmail,
      username: user.username ?? null,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      image_url: user.imageUrl ?? null,
    })

  if (error) {
    console.error('Error creating profile:', error)
    return { userId: null, error }
  }

  console.log('Profile created for user:', user.id)
  return { userId: user.id, error: null }
}
