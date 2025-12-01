/**
 * Supabase Module Exports
 * 
 * Central export point for all Supabase-related functionality
 */

// Client exports
export { 
  createBrowserClient, 
  createAuthenticatedClient, 
  getBrowserClient 
} from './client'

// Server exports
export { 
  createServerClient, 
  createAdminClient, 
  getAdminClient 
} from './server'

// Auth exports (Clerk + Supabase integration)
export {
  createClerkSupabaseClient,
  getCurrentUserId,
  isAuthenticated,
  ensureUserProfile,
} from './auth'

// Client hooks (for React components)
export {
  useSupabaseClient,
  useSupabaseAnonymousClient,
} from './hooks'

// Query exports
export * from './queries'

// Type exports
export type {
  Database,
  Tables,
  InsertTables,
  UpdateTables,
  Views,
  Profile,
  Idea,
  IdeaVote,
  IdeaComment,
  UserBookmark,
  Subreddit,
  FetchLog,
  IdeaView,
  UserActivitySummary,
  UserVotedIdea,
  UserCommentedIdea,
  UserBookmarkedIdea,
  CommentWithProfile,
  InsertIdea,
  InsertProfile,
  InsertVote,
  InsertComment,
  InsertBookmark,
} from './types'
