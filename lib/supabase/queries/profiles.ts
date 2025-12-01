/**
 * Profiles Database Queries
 * 
 * Reusable query functions for profiles table operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, UserActivitySummary } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>

/**
 * Get profile by user ID
 */
export async function getProfileById(
  client: Client,
  userId: string
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

/**
 * Get profile by email
 */
export async function getProfileByEmail(
  client: Client,
  email: string
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  return { data, error }
}

export interface UpsertProfileInput {
  id: string
  email: string
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
}

/**
 * Create or update a profile (used by Clerk webhook)
 */
export async function upsertProfile(
  client: Client,
  profile: UpsertProfileInput
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await client
    .from('profiles')
    .upsert({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      image_url: profile.image_url,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update profile (owner only - enforced by RLS)
 */
export async function updateProfile(
  client: Client,
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete profile (used by Clerk webhook on user deletion)
 */
export async function deleteProfile(
  client: Client,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('profiles')
    .delete()
    .eq('id', userId)

  return { error }
}

/**
 * Get user activity summary (stats for dashboard)
 */
export async function getUserActivitySummary(
  client: Client,
  userId: string
): Promise<{ data: UserActivitySummary | null; error: Error | null }> {
  const { data, error } = await client
    .from('user_activity_summary')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

/**
 * Check if profile exists
 */
export async function profileExists(
  client: Client,
  userId: string
): Promise<{ exists: boolean; error: Error | null }> {
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  return { exists: !!data, error }
}
