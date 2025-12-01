/**
 * Ideas Database Queries
 * 
 * Reusable query functions for ideas table operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, IdeaView } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>

// ============================================
// READ OPERATIONS
// ============================================

export interface GetIdeasOptions {
  source?: 'reddit' | 'user' | 'all'
  subreddit?: string
  minScore?: number
  sortBy?: 'created_at' | 'upvotes' | 'market_potential_score' | 'trending_score'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
  search?: string
}

/**
 * Get ideas with filters and pagination
 */
export async function getIdeas(
  client: Client,
  options: GetIdeasOptions = {}
): Promise<{ data: IdeaView[] | null; error: Error | null; count: number | null }> {
  const {
    source = 'all',
    subreddit,
    minScore,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
    search,
  } = options

  let query = client
    .from('ideas_view')
    .select('*', { count: 'exact' })

  // Apply filters
  if (source !== 'all') {
    query = query.eq('source', source)
  }

  if (subreddit) {
    query = query.eq('subreddit', subreddit)
  }

  if (minScore !== undefined) {
    query = query.gte('market_potential_score', minScore)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  return { data, error, count }
}

/**
 * Get single idea by ID
 */
export async function getIdeaById(
  client: Client,
  ideaId: string
): Promise<{ data: IdeaView | null; error: Error | null }> {
  const { data, error } = await client
    .from('ideas_view')
    .select('*')
    .eq('id', ideaId)
    .single()

  return { data, error }
}

/**
 * Get ideas by user ID
 */
export async function getIdeasByUserId(
  client: Client,
  userId: string,
  includeUnpublished = false
): Promise<{ data: IdeaView[] | null; error: Error | null }> {
  let query = client
    .from('ideas_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!includeUnpublished) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * Get top ideas for leaderboard
 */
export async function getLeaderboardIdeas(
  client: Client,
  options: {
    source?: 'reddit' | 'user' | 'all'
    timeRange?: 'today' | 'week' | 'month' | 'all'
    limit?: number
  } = {}
): Promise<{ data: IdeaView[] | null; error: Error | null }> {
  const { source = 'all', timeRange = 'all', limit = 10 } = options

  let query = client
    .from('ideas_view')
    .select('*')
    .eq('status', 'published')

  if (source !== 'all') {
    query = query.eq('source', source)
  }

  // Apply time filter
  if (timeRange !== 'all') {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      default:
        startDate = new Date(0)
    }

    query = query.gte('created_at', startDate.toISOString())
  }

  // Sort by platform score (upvotes - downvotes)
  query = query
    .order('platform_score', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  return { data, error }
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Generate a unique ID for user-submitted ideas
 */
export function generateUserIdeaId(): string {
  const chars = 'abcdef0123456789'
  let id = 'u'
  for (let i = 0; i < 7; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

export interface CreateIdeaInput {
  title: string
  description: string
  body_text?: string | null
  user_id: string
  status?: 'draft' | 'published' | 'archived'
  market_potential_score?: number
  original_description?: string
}

/**
 * Create a new user idea
 */
export async function createIdea(
  client: Client,
  idea: CreateIdeaInput
): Promise<{ data: Database['public']['Tables']['ideas']['Row'] | null; error: Error | null }> {
  const { data, error } = await client
    .from('ideas')
    .insert({
      id: generateUserIdeaId(),
      title: idea.title,
      description: idea.description,
      body_text: idea.body_text,
      user_id: idea.user_id,
      source: 'user',
      status: idea.status ?? 'published',
      market_potential_score: idea.market_potential_score ?? 50,
      original_title: idea.original_description, // Store original user description in original_title field
    })
    .select()
    .single()

  return { data, error }
}

export interface UpdateIdeaInput {
  title?: string
  description?: string
  body_text?: string | null
  status?: 'draft' | 'published' | 'archived'
}

/**
 * Update an existing idea (owner only - enforced by RLS)
 */
export async function updateIdea(
  client: Client,
  ideaId: string,
  updates: UpdateIdeaInput
): Promise<{ data: Database['public']['Tables']['ideas']['Row'] | null; error: Error | null }> {
  const { data, error } = await client
    .from('ideas')
    .update(updates)
    .eq('id', ideaId)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete an idea (owner only - enforced by RLS)
 */
export async function deleteIdea(
  client: Client,
  ideaId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('ideas')
    .delete()
    .eq('id', ideaId)

  return { error }
}
