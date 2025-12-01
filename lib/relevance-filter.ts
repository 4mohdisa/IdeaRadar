import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RedditPost } from './types';

// Initialize Gemini client for relevance checking
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Check if a Reddit post is relevant (about a startup/project idea)
 * Uses Gemini AI to analyze post content for relevance
 */
export async function isPostRelevant(post: RedditPost): Promise<boolean> {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a content relevance classifier for startup and business ideas.

Analyze this Reddit post and determine if it is about a NEW startup idea, business concept, or project idea.

INCLUDE posts that:
- Present a new startup or business idea
- Propose a new product or service concept
- Describe a side project or app idea
- Discuss a business opportunity or market gap
- Share a concept for solving a specific problem

EXCLUDE posts that:
- Only discuss existing companies or products
- Are purely questions without proposing ideas
- Are about general business advice or strategies
- Are self-promotion or marketing existing services
- Are off-topic discussions or memes
- Are just asking for feedback on existing projects without details

Title: ${post.title}
Content: ${post.selftext.substring(0, 500)}

Respond with ONLY one word: "RELEVANT" or "NOT_RELEVANT"`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim().toUpperCase();

    return response.includes('RELEVANT') && !response.includes('NOT_RELEVANT');
  } catch (error) {
    console.error('Error checking post relevance:', error);
    // On error, be conservative and include the post
    // Better to have false positives than miss good ideas
    return true;
  }
}

/**
 * Filter posts by relevance using AI
 * Processes posts in batches to respect rate limits
 */
export async function filterRelevantPosts(
  posts: RedditPost[],
  onProgress?: (checked: number, total: number, relevant: number) => void
): Promise<RedditPost[]> {
  const relevantPosts: RedditPost[] = [];
  const delayBetweenRequests = 1000; // 1 second delay

  for (let i = 0; i < posts.length; i++) {
    try {
      const isRelevant = await isPostRelevant(posts[i]);

      if (isRelevant) {
        relevantPosts.push(posts[i]);
      }

      if (onProgress) {
        onProgress(i + 1, posts.length, relevantPosts.length);
      }

      // Delay between requests to avoid rate limiting
      if (i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
      }
    } catch (error) {
      console.error(`Failed to check relevance for post ${posts[i].id}:`, error);
      // Include post on error to avoid losing potentially good content
      relevantPosts.push(posts[i]);
    }
  }

  return relevantPosts;
}

/**
 * Quick heuristic filter before AI check (to reduce API calls)
 * Filters out obvious non-relevant posts based on simple rules
 */
export function quickFilterPosts(posts: RedditPost[]): RedditPost[] {
  return posts.filter((post) => {
    // Must have substantial text content
    if (post.selftext.length < 50) return false;

    // Filter out removed/deleted content
    if (
      post.selftext.includes('[removed]') ||
      post.selftext.includes('[deleted]')
    ) {
      return false;
    }

    // Minimum engagement threshold (avoid spam)
    if (post.score < 2) return false;

    // Exclude obvious non-idea posts by title keywords
    const titleLower = post.title.toLowerCase();
    const excludeKeywords = [
      'ama',
      'ask me anything',
      'weekly thread',
      'monthly thread',
      'discussion thread',
      'self-promotion',
      'shameless plug',
    ];

    if (excludeKeywords.some((keyword) => titleLower.includes(keyword))) {
      return false;
    }

    return true;
  });
}
