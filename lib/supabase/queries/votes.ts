/**
 * Votes Database Queries
 * 
 * Reusable query functions for idea_votes table operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, IdeaVote } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>

export type VoteType = 1 | -1

/**
 * Get user's vote on a specific idea
 */
export async function getUserVote(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ data: IdeaVote | null; error: Error | null }> {
  const { data, error } = await client
    .from('idea_votes')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle()

  return { data, error }
}

/**
 * Get all votes for an idea
 */
export async function getIdeaVotes(
  client: Client,
  ideaId: string
): Promise<{ data: IdeaVote[] | null; error: Error | null }> {
  const { data, error } = await client
    .from('idea_votes')
    .select('*')
    .eq('idea_id', ideaId)

  return { data, error }
}

/**
 * Get vote counts for an idea
 */
export async function getVoteCounts(
  client: Client,
  ideaId: string
): Promise<{ upvotes: number; downvotes: number; error: Error | null }> {
  const { data, error } = await client
    .from('idea_votes')
    .select('vote_type')
    .eq('idea_id', ideaId)

  if (error || !data) {
    return { upvotes: 0, downvotes: 0, error }
  }

  const upvotes = data.filter((v: { vote_type: number }) => v.vote_type === 1).length
  const downvotes = data.filter((v: { vote_type: number }) => v.vote_type === -1).length

  return { upvotes, downvotes, error: null }
}

/**
 * Cast or update a vote on an idea
 * Uses upsert to handle both new votes and vote changes
 */
export async function castVote(
  client: Client,
  ideaId: string,
  userId: string,
  voteType: VoteType
): Promise<{ data: IdeaVote | null; error: Error | null }> {
  const { data, error } = await client
    .from('idea_votes')
    .upsert(
      {
        idea_id: ideaId,
        user_id: userId,
        vote_type: voteType,
      },
      {
        onConflict: 'idea_id,user_id',
      }
    )
    .select()
    .single()

  return { data, error }
}

/**
 * Remove a vote from an idea
 */
export async function removeVote(
  client: Client,
  ideaId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await client
    .from('idea_votes')
    .delete()
    .eq('idea_id', ideaId)
    .eq('user_id', userId)

  return { error }
}

/**
 * Get all ideas a user has voted on
 */
export async function getUserVotedIdeas(
  client: Client,
  userId: string
): Promise<{ data: Database['public']['Views']['user_voted_ideas']['Row'][] | null; error: Error | null }> {
  const { data, error } = await client
    .from('user_voted_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('voted_at', { ascending: false })

  return { data, error }
}
