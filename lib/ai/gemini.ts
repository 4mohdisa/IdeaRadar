/**
 * Gemini AI Service
 * 
 * Provides AI-powered scoring and summary generation for startup ideas
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.")
}

interface IdeaAnalysis {
  market_potential_score: number
  ai_summary: string
}

interface ScoreBreakdown {
  market_relevance: number
  scalability: number
  monetization: number
  competition: number
}

/**
 * Analyze a startup idea using Gemini AI
 * Returns a market potential score (0-100) and an AI-generated summary
 */
export async function analyzeIdea(
  title: string,
  description: string,
  bodyText?: string | null
): Promise<IdeaAnalysis> {
  // Return default values if API key is not configured
  if (!GEMINI_API_KEY) {
    return {
      market_potential_score: 50,
      ai_summary: description,
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    })

    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description

    const prompt = `You are an expert startup analyst and venture capitalist. Analyze the following startup idea and provide:

1. A market potential score from 0-100 based on these criteria:
   - Market Relevance (0-25): Current demand and market timing
   - Scalability Potential (0-25): Growth capability and expansion potential
   - Monetization Simplicity (0-25): Clear revenue model and path to profitability
   - Competition Level (0-25): Market saturation and competitive advantage (higher score = less competition/better positioning)

2. A concise, professional summary (2-3 paragraphs) that:
   - Explains the core value proposition
   - Identifies the target market and key use cases
   - Highlights potential strengths and challenges

STARTUP IDEA:
Title: ${title}

Description: ${fullContent}

Respond in the following JSON format ONLY (no markdown, no code blocks, just raw JSON):
{
  "score_breakdown": {
    "market_relevance": <number 0-25>,
    "scalability": <number 0-25>,
    "monetization": <number 0-25>,
    "competition": <number 0-25>
  },
  "total_score": <number 0-100>,
  "summary": "<string with 2-3 paragraph summary>"
}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse the JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const analysis = JSON.parse(cleanedResponse) as {
      score_breakdown: ScoreBreakdown
      total_score: number
      summary: string
    }

    // Validate and clamp the score
    const score = Math.min(100, Math.max(0, Math.round(analysis.total_score)))

    return {
      market_potential_score: score,
      ai_summary: analysis.summary || description,
    }
  } catch (error) {
    console.error("Error analyzing idea with Gemini:", error)
    // Return default values on error
    return {
      market_potential_score: 50,
      ai_summary: description,
    }
  }
}

/**
 * Generate just an AI summary for an existing idea
 */
export async function generateSummary(
  title: string,
  description: string,
  bodyText?: string | null
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return description
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    })

    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description

    const prompt = `You are an expert startup analyst. Write a concise, professional summary (2-3 paragraphs) for this startup idea that:
- Explains the core value proposition clearly
- Identifies the target market and key use cases
- Highlights potential strengths and challenges

STARTUP IDEA:
Title: ${title}

Description: ${fullContent}

Write the summary directly without any preamble or labels:`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error("Error generating summary with Gemini:", error)
    return description
  }
}

/**
 * Calculate just the market potential score for an idea
 */
export async function calculateScore(
  title: string,
  description: string,
  bodyText?: string | null
): Promise<number> {
  if (!GEMINI_API_KEY) {
    return 50
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 200,
      },
    })

    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description

    const prompt = `You are an expert startup analyst. Score this startup idea from 0-100 based on:
- Market Relevance (0-25): Current demand and market timing
- Scalability Potential (0-25): Growth capability
- Monetization Simplicity (0-25): Clear revenue model
- Competition Level (0-25): Market positioning (higher = better)

STARTUP IDEA:
Title: ${title}
Description: ${fullContent}

Respond with ONLY a single number (the total score from 0-100), nothing else:`

    const result = await model.generateContent(prompt)
    const scoreText = result.response.text().trim()
    const score = parseInt(scoreText, 10)

    if (isNaN(score)) {
      return 50
    }

    return Math.min(100, Math.max(0, score))
  } catch (error) {
    console.error("Error calculating score with Gemini:", error)
    return 50
  }
}
