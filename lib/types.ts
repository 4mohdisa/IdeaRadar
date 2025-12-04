// Type definitions for IdeaRadar

// Subreddit type - union of allowed subreddits
export type Subreddit =
  | 'startup'
  | 'startupideas'
  | 'Entrepreneur'
  | 'sideproject'
  | 'businessideas'
  | 'EntrepreneurRideAlong'
  | 'saas'
  | 'smallbusiness';

// List of subreddits to fetch from
export const SUBREDDITS: readonly Subreddit[] = [
  'startup',
  'startupideas',
  'Entrepreneur',
  'sideproject',
  'businessideas',
  'EntrepreneurRideAlong',
  'saas',
  'smallbusiness',
] as const;

// Raw Reddit post data
export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  thumbnail?: string;
}

// Gemini AI processed data
export interface GeminiProcessedIdea {
  enhanced_title: string;
  description: string;
  market_potential_score: number;
}

// Combined idea (Reddit + Gemini + User submissions)
export interface Idea {
  id: string;
  title: string; // AI-enhanced title or user title
  original_title?: string; // Original Reddit title
  description: string; // AI-generated summary or user description
  body_text: string; // Full content
  source: "reddit" | "user"; // Source of the idea
  
  // Reddit-specific fields
  subreddit?: string;
  reddit_author?: string;
  reddit_score?: number;
  reddit_comments?: number;
  post_url?: string;
  thumbnail?: string;
  
  // User-submitted idea fields
  user_id?: string;
  author?: string; // Display name for community ideas
  author_username?: string | null; // Username for profile link
  author_avatar?: string | null; // Avatar URL
  status?: "draft" | "published" | "archived";
  
  // Platform engagement metrics
  upvotes: number; // Platform upvotes
  downvotes: number; // Platform downvotes
  comments_count: number; // Platform comments
  bookmark_count?: number;
  
  // AI-generated
  market_potential_score: number; // 0-100
  
  // Metadata
  created_at: string;
  updated_at?: string;
  processed_at?: string; // When the idea was processed by Gemini
}

export interface Comment {
  id: string;
  idea_id: string;
  user_id: string;
  author: string;
  author_avatar?: string;
  content: string;
  parent_id?: string; // For nested replies
  upvotes: number;
  created_at: string;
  updated_at?: string;
  is_author?: boolean; // Is this the idea author?
  replies?: Comment[];
}

export interface UserVote {
  idea_id: string;
  vote_type: "up" | "down";
}

export interface Bookmark {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface DashboardStats {
  total_ideas: number;
  published_ideas: number;
  draft_ideas: number;
  total_upvotes_received: number;
  total_comments_received: number;
  ideas_upvoted: number;
  ideas_downvoted: number;
  ideas_commented: number;
  ideas_bookmarked: number;
}

export interface LeaderboardIdea extends Idea {
  rank: number;
  net_score: number; // upvotes - downvotes
}
