/**
 * Supabase Database Types
 * 
 * These types are manually defined based on database/schema.sql
 * For production, generate types using: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          original_title: string | null
          description: string
          body_text: string | null
          source: 'reddit' | 'user'
          user_id: string | null
          subreddit: string | null
          reddit_author: string | null
          post_url: string | null
          reddit_score: number
          reddit_comments: number
          upvotes: number
          downvotes: number
          comments_count: number
          thumbnail: string | null
          market_potential_score: number | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          processed_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          original_title?: string | null
          description: string
          body_text?: string | null
          source?: 'reddit' | 'user'
          user_id?: string | null
          subreddit?: string | null
          reddit_author?: string | null
          post_url?: string | null
          reddit_score?: number
          reddit_comments?: number
          upvotes?: number
          downvotes?: number
          comments_count?: number
          thumbnail?: string | null
          market_potential_score?: number | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          processed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          original_title?: string | null
          description?: string
          body_text?: string | null
          source?: 'reddit' | 'user'
          user_id?: string | null
          subreddit?: string | null
          reddit_author?: string | null
          post_url?: string | null
          reddit_score?: number
          reddit_comments?: number
          upvotes?: number
          downvotes?: number
          comments_count?: number
          thumbnail?: string | null
          market_potential_score?: number | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          processed_at?: string | null
          updated_at?: string
        }
      }
      subreddits: {
        Row: {
          id: number
          name: string
          display_name: string
          is_active: boolean
          last_fetched_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          display_name: string
          is_active?: boolean
          last_fetched_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          display_name?: string
          is_active?: boolean
          last_fetched_at?: string | null
          created_at?: string
        }
      }
      fetch_logs: {
        Row: {
          id: number
          fetch_type: string
          subreddit: string | null
          posts_fetched: number
          posts_processed: number
          status: string
          error_message: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          fetch_type: string
          subreddit?: string | null
          posts_fetched?: number
          posts_processed?: number
          status: string
          error_message?: string | null
          started_at: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          fetch_type?: string
          subreddit?: string | null
          posts_fetched?: number
          posts_processed?: number
          status?: string
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      user_bookmarks: {
        Row: {
          id: number
          user_id: string
          idea_id: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          idea_id: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          idea_id?: string
          created_at?: string
        }
      }
      idea_votes: {
        Row: {
          id: number
          idea_id: string
          user_id: string
          vote_type: 1 | -1
          created_at: string
        }
        Insert: {
          id?: number
          idea_id: string
          user_id: string
          vote_type: 1 | -1
          created_at?: string
        }
        Update: {
          id?: number
          idea_id?: string
          user_id?: string
          vote_type?: 1 | -1
          created_at?: string
        }
      }
      idea_comments: {
        Row: {
          id: number
          idea_id: string
          user_id: string
          content: string
          parent_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          idea_id: string
          user_id: string
          content: string
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          idea_id?: string
          user_id?: string
          content?: string
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      ideas_view: {
        Row: {
          id: string
          title: string
          original_title: string | null
          description: string
          body_preview: string | null
          source: 'reddit' | 'user'
          user_id: string | null
          subreddit: string | null
          post_url: string | null
          thumbnail: string | null
          market_potential_score: number | null
          status: 'draft' | 'published' | 'archived'
          reddit_score: number
          reddit_comments: number
          reddit_author: string | null
          platform_upvotes: number
          platform_downvotes: number
          platform_score: number
          platform_comments: number
          author_username: string | null
          author_name: string | null
          author_avatar: string | null
          source_label: string
          created_at: string
          processed_at: string | null
          trending_score: number
        }
      }
      user_activity_summary: {
        Row: {
          user_id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
          ideas_created: number
          upvotes_given: number
          downvotes_given: number
          comments_made: number
          bookmarks_count: number
          total_upvotes_received: number
          total_comments_received: number
          member_since: string
        }
      }
      user_voted_ideas: {
        Row: {
          user_id: string
          idea_id: string
          vote_type: 1 | -1
          vote_label: string
          voted_at: string
          title: string
          description: string
          source: 'reddit' | 'user'
          market_potential_score: number | null
        }
      }
      user_commented_ideas: {
        Row: {
          user_id: string
          idea_id: string
          title: string
          description: string
          source: 'reddit' | 'user'
          market_potential_score: number | null
          user_comment_count: number
          last_commented_at: string
        }
      }
      user_bookmarked_ideas: {
        Row: {
          user_id: string
          idea_id: string
          bookmarked_at: string
          title: string
          description: string
          source: 'reddit' | 'user'
          market_potential_score: number | null
          platform_upvotes: number
          platform_comments: number
          source_label: string
        }
      }
      comments_with_profiles: {
        Row: {
          id: number
          idea_id: string
          user_id: string
          content: string
          parent_id: number | null
          created_at: string
          updated_at: string
          username: string | null
          first_name: string | null
          last_name: string | null
          image_url: string | null
        }
      }
    }
    Functions: {
      generate_user_idea_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

export type Views<T extends keyof Database['public']['Views']> = 
  Database['public']['Views'][T]['Row']

// Commonly used types
export type Profile = Tables<'profiles'>
export type Idea = Tables<'ideas'>
export type IdeaVote = Tables<'idea_votes'>
export type IdeaComment = Tables<'idea_comments'>
export type UserBookmark = Tables<'user_bookmarks'>
export type Subreddit = Tables<'subreddits'>
export type FetchLog = Tables<'fetch_logs'>

// View types
export type IdeaView = Views<'ideas_view'>
export type UserActivitySummary = Views<'user_activity_summary'>
export type UserVotedIdea = Views<'user_voted_ideas'>
export type UserCommentedIdea = Views<'user_commented_ideas'>
export type UserBookmarkedIdea = Views<'user_bookmarked_ideas'>
export type CommentWithProfile = Views<'comments_with_profiles'>

// Insert types
export type InsertIdea = InsertTables<'ideas'>
export type InsertProfile = InsertTables<'profiles'>
export type InsertVote = InsertTables<'idea_votes'>
export type InsertComment = InsertTables<'idea_comments'>
export type InsertBookmark = InsertTables<'user_bookmarks'>
