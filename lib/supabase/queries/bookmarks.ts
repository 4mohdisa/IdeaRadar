/**
 * Bookmarks Database Queries
 * 
 * Reusable query functions for user_bookmarks table operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserBookmark } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>

/**
 * Check if user has bookmarked an idea
 */
export async function isIdeaBookmarked(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ isBookmarked: boolean; error: Error | null }> {
  const { data, error } = await client
    .from('user_bookmarks')
    .select('id')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()

  return { isBookmarked: !!data, error }
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(
  client: Client,
  userId: string
): Promise<{ data: Database['public']['Views']['user_bookmarked_ideas']['Row'][] | null; error: Error | null }> {
  const { data, error } = await client
    .from('user_bookmarked_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('bookmarked_at', { ascending: false })

  return { data, error }
}

/**
 * Get bookmark count for a user
 */
export async function getBookmarkCount(
  client: Client,
  userId: string
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await client
    .from('user_bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return { count: count ?? 0, error }
}

/**
 * Add a bookmark
 */
export async function addBookmark(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ data: UserBookmark | null; error: Error | null }> {
  const { data, error } = await client
    .from('user_bookmarks')
    .insert({
      idea_id: ideaId,
      user_id: userId,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('user_bookmarks')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', userId)

  return { error }
}

/**
 * Toggle bookmark (add if not exists, remove if exists)
 */
export async function toggleBookmark(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ isBookmarked: boolean; error: Error | null }> {
  // Check current state
  const { isBookmarked, error: checkError } = await isIdeaBookmarked(client, ideaId, userId)
  
  if (checkError) {
    return { isBookmarked: false, error: checkError }
  }

  if (isBookmarked) {
    const { error } = await removeBookmark(client, ideaId, userId)
    return { isBookmarked: false, error }
  } else {
    const { error } = await addBookmark(client, ideaId, userId)
    return { isBookmarked: true, error }
  }
}
