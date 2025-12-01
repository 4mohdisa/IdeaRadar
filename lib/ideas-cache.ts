import type { Idea, RedditPost } from './types';
import { processPostWithGemini } from './gemini-client';

// In-memory cache for processed ideas
let ideasCache: Idea[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Convert Reddit post + Gemini data to Idea
export function combinePostAndGeminiData(
  redditPost: RedditPost,
  geminiData: {
    enhanced_title: string;
    description: string;
    market_potential_score: number;
  }
): Idea {
  return {
    id: redditPost.id,
    // Source tracking
    source: 'reddit',
    // Original Reddit data
    original_title: redditPost.title,
    body_text: redditPost.selftext,
    subreddit: redditPost.subreddit,
    reddit_author: redditPost.author,
    reddit_score: redditPost.score,
    reddit_comments: redditPost.num_comments,
    created_at: new Date(redditPost.created_utc * 1000).toISOString(),
    post_url: redditPost.permalink,
    thumbnail: redditPost.thumbnail,
    // Platform engagement (starts at 0)
    upvotes: 0,
    downvotes: 0,
    comments_count: 0,
    // Gemini processed data
    title: geminiData.enhanced_title,
    description: geminiData.description,
    market_potential_score: geminiData.market_potential_score,
    // Metadata
    processed_at: new Date().toISOString(),
  };
}

// Get all cached ideas
export function getCachedIdeas(): Idea[] {
  return ideasCache;
}

// Get idea by ID from cache
export function getCachedIdeaById(id: string): Idea | undefined {
  return ideasCache.find((idea) => idea.id === id);
}

// Add ideas to cache
export function addIdeasToCache(ideas: Idea[]): void {
  // Merge with existing cache, avoiding duplicates
  const existingIds = new Set(ideasCache.map((i) => i.id));
  const newIdeas = ideas.filter((idea) => !existingIds.has(idea.id));

  ideasCache = [...ideasCache, ...newIdeas];
  lastFetchTime = Date.now();
}

// Replace entire cache
export function replaceCacheWithIdeas(ideas: Idea[]): void {
  ideasCache = ideas;
  lastFetchTime = Date.now();
}

// Check if cache needs refresh
export function shouldRefreshCache(): boolean {
  return Date.now() - lastFetchTime > CACHE_DURATION || ideasCache.length === 0;
}

// Clear cache
export function clearCache(): void {
  ideasCache = [];
  lastFetchTime = 0;
}

// Process and cache a single Reddit post
export async function processAndCachePost(redditPost: RedditPost): Promise<Idea> {
  const geminiData = await processPostWithGemini(redditPost);
  const idea = combinePostAndGeminiData(redditPost, geminiData);

  // Add to cache if not already present
  const existing = getCachedIdeaById(idea.id);
  if (!existing) {
    addIdeasToCache([idea]);
  }

  return idea;
}

// Filter and sort ideas
export function filterAndSortIdeas(
  ideas: Idea[],
  filters: {
    search?: string;
    subreddit?: string;
    sort?: 'popular' | 'recent' | 'comments' | 'score';
  }
): Idea[] {
  let filtered = [...ideas];

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (idea) =>
        idea.title.toLowerCase().includes(searchLower) ||
        idea.description.toLowerCase().includes(searchLower) ||
        (idea.body_text?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  // Apply subreddit filter
  if (filters.subreddit && filters.subreddit !== 'all') {
    filtered = filtered.filter((idea) => idea.subreddit === filters.subreddit);
  }

  // Apply sorting
  switch (filters.sort) {
    case 'recent':
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'comments':
      filtered.sort((a, b) => b.comments_count - a.comments_count);
      break;
    case 'score':
      filtered.sort((a, b) => b.market_potential_score - a.market_potential_score);
      break;
    case 'popular':
    default:
      filtered.sort((a, b) => b.upvotes - a.upvotes);
      break;
  }

  return filtered;
}

// Paginate ideas
export function paginateIdeas(ideas: Idea[], page: number = 1, limit: number = 12) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    ideas: ideas.slice(startIndex, endIndex),
    total: ideas.length,
    page,
    limit,
    totalPages: Math.ceil(ideas.length / limit),
  };
}
