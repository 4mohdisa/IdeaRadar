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

// Process a Reddit post with Gemini 2.5 Flash to generate enhanced content
export async function processPostWithGemini(post: RedditPost): Promise<GeminiProcessedIdea> {
  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an expert startup idea analyzer. Analyze this Reddit post and provide a professional assessment.

SCORING CRITERIA (each 0-10 points, total 0-100):
- market_demand: Current market demand for this solution
- market_timing: Is now the right time?
- revenue_clarity: Clear monetization path
- scalability: Growth potential
- unique_value: Differentiation level
- competitive_moat: Defensibility
- technical_feasibility: Can it be built?
- execution_complexity: Ease of execution (10 = easy)
- market_risk: Market adoption confidence (10 = confident)
- regulatory_risk: Regulatory safety (10 = safe)

Reddit Post:
Title: ${post.title}
Content: ${post.selftext}
Subreddit: r/${post.subreddit}
Upvotes: ${post.score} (consider as community validation signal)

Return JSON:
{
  "enhanced_title": "<improved professional title, max 100 chars>",
  "description": "<structured description with Problem, Solution, Target Audience, Use Case - 200-300 words>",
  "market_potential_score": <total score 0-100>,
  "score_breakdown": {
    "market_demand": <0-10>,
    "market_timing": <0-10>,
    "revenue_clarity": <0-10>,
    "scalability": <0-10>,
    "unique_value": <0-10>,
    "competitive_moat": <0-10>,
    "technical_feasibility": <0-10>,
    "execution_complexity": <0-10>,
    "market_risk": <0-10>,
    "regulatory_risk": <0-10>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "challenges": ["<challenge 1>", "<challenge 2>", "<challenge 3>"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
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
      enhanced_title: parsed.enhanced_title.substring(0, 150),
      description: parsed.description,
      market_potential_score: score,
      score_breakdown: parsed.score_breakdown,
      strengths: parsed.strengths,
      challenges: parsed.challenges,
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
