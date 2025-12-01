import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RedditPost, GeminiProcessedIdea } from './types';

// Initialize Gemini client
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

// Process a Reddit post with Gemini to generate enhanced content
export async function processPostWithGemini(post: RedditPost): Promise<GeminiProcessedIdea> {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert startup idea analyzer. Analyze the following startup/business idea post from Reddit and provide:

1. An improved, professional title (max 100 characters)
2. A neutral, structured description following this format:
   - Problem: What problem does it solve?
   - Solution: What is the proposed solution?
   - Target Audience: Who is this for?
   - Potential Use Case: How would it be used?
3. A Market Potential Score (1-100) based on:
   - Relevance in modern markets (25 points)
   - Scalability potential (25 points)
   - Monetization simplicity (25 points)
   - Competition level (25 points - lower competition = higher score)

Original Post Title: ${post.title}
Original Post Content: ${post.selftext}
Subreddit: ${post.subreddit}
Upvotes: ${post.score}

Respond in JSON format:
{
  "enhanced_title": "your improved title here",
  "description": "your structured description here",
  "market_potential_score": 75
}

Ensure your description is concise (200-300 words), professional, and objective.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate the response structure
    if (
      !parsed.enhanced_title ||
      !parsed.description ||
      typeof parsed.market_potential_score !== 'number'
    ) {
      throw new Error('Invalid response structure from Gemini');
    }

    // Ensure score is within bounds
    const score = Math.max(1, Math.min(100, parsed.market_potential_score));

    return {
      enhanced_title: parsed.enhanced_title.substring(0, 150), // Enforce max length
      description: parsed.description,
      market_potential_score: score,
    };
  } catch (error) {
    console.error('Error processing post with Gemini:', error);

    // Fallback to basic processing if Gemini fails
    return {
      enhanced_title: post.title,
      description: `**Problem & Context:**\n${post.selftext.substring(0, 300)}...\n\n*Note: AI processing temporarily unavailable. Showing original content.*`,
      market_potential_score: 50,
    };
  }
}

// Batch process multiple posts (with rate limiting)
export async function batchProcessPosts(
  posts: RedditPost[],
  onProgress?: (processed: number, total: number) => void
): Promise<GeminiProcessedIdea[]> {
  const results: GeminiProcessedIdea[] = [];
  const delayBetweenRequests = 1000; // 1 second delay to respect rate limits

  for (let i = 0; i < posts.length; i++) {
    try {
      const processed = await processPostWithGemini(posts[i]);
      results.push(processed);

      if (onProgress) {
        onProgress(i + 1, posts.length);
      }

      // Delay between requests to avoid rate limiting
      if (i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
      }
    } catch (error) {
      console.error(`Failed to process post ${posts[i].id}:`, error);
      // Add fallback for failed posts
      results.push({
        enhanced_title: posts[i].title,
        description: posts[i].selftext.substring(0, 300) + '...',
        market_potential_score: 50,
      });
    }
  }

  return results;
}
