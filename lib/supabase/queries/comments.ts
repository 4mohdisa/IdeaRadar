/**
 * Comments Database Queries
 * 
 * Reusable query functions for idea_comments table operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CommentWithProfile } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>

/**
 * Get all comments for an idea with user profiles
 */
export async function getIdeaComments(
  client: Client,
  ideaId: string
): Promise<{ data: CommentWithProfile[] | null; error: Error | null }> {
  const { data, error } = await client
    .from('comments_with_profiles')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true })

  return { data, error }
}

/**
 * Get a single comment by ID
 */
export async function getCommentById(
  client: Client,
  commentId: number
): Promise<{ data: CommentWithProfile | null; error: Error | null }> {
  const { data, error } = await client
    .from('comments_with_profiles')
    .select('*')
    .eq('id', commentId)
    .single()

  return { data, error }
}

/**
 * Get replies to a comment
 */
export async function getCommentReplies(
  client: Client,
  parentId: number
): Promise<{ data: CommentWithProfile[] | null; error: Error | null }> {
  const { data, error } = await client
    .from('comments_with_profiles')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export interface CreateCommentInput {
  idea_id: string
  user_id: string
  content: string
  parent_id?: number | null
}

/**
 * Create a new comment
 */
export async function createComment(
  client: Client,
  comment: CreateCommentInput
): Promise<{ data: Database['public']['Tables']['idea_comments']['Row'] | null; error: Error | null }> {
  const { data, error } = await client
    .from('idea_comments')
    .insert({
      idea_id: comment.idea_id,
      user_id: comment.user_id,
      content: comment.content,
      parent_id: comment.parent_id ?? null,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update a comment (owner only - enforced by RLS)
 */
export async function updateComment(
  client: Client,
  commentId: number,
  content: string
): Promise<{ data: Database['public']['Tables']['idea_comments']['Row'] | null; error: Error | null }> {
  const { data, error } = await client
    .from('idea_comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete a comment (owner only - enforced by RLS)
 */
export async function deleteComment(
  client: Client,
  commentId: number
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('idea_comments')
    .delete()
    .eq('id', commentId)

  return { error }
}

/**
 * Get all ideas a user has commented on
 */
export async function getUserCommentedIdeas(
  client: Client,
  userId: string
): Promise<{ data: Database['public']['Views']['user_commented_ideas']['Row'][] | null; error: Error | null }> {
  const { data, error } = await client
    .from('user_commented_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('last_commented_at', { ascending: false })

  return { data, error }
}

/**
 * Get comment count for an idea
 */
export async function getCommentCount(
  client: Client,
  ideaId: string
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await client
    .from('idea_comments')
    .select('*', { count: 'exact', head: true })
    .eq('idea_id', ideaId)

  return { count: count ?? 0, error }
}
