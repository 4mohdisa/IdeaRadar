/**
 * Gemini AI Service
 * 
 * Provides AI-powered scoring and summary generation for startup ideas
 * Uses Gemini 2.5 Flash for improved accuracy and structured output
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import { analyzeIdeaEnhanced, type ScoreBreakdown } from "./scoring"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.")
}

interface IdeaAnalysis {
  market_potential_score: number
  ai_summary: string
  score_breakdown?: ScoreBreakdown
  strengths?: string[]
  challenges?: string[]
  target_market?: string
  suggested_next_steps?: string[]
}

// Re-export for backward compatibility
export type { ScoreBreakdown }

/**
 * Analyze a startup idea using Gemini 2.5 Flash
 * Returns a market potential score (0-100), AI-generated summary, and detailed breakdown
 */
export async function analyzeIdea(
  title: string,
  description: string,
  bodyText?: string | null,
  context?: {
    source?: "reddit" | "community"
    subreddit?: string
    upvotes?: number
    comments?: number
  }
): Promise<IdeaAnalysis> {
  // Use the enhanced scoring service
  const analysis = await analyzeIdeaEnhanced(title, description, bodyText, context)
  
  return {
    market_potential_score: analysis.total_score,
    ai_summary: analysis.ai_summary,
    score_breakdown: analysis.score_breakdown,
    strengths: analysis.strengths,
    challenges: analysis.challenges,
    target_market: analysis.target_market,
    suggested_next_steps: analysis.suggested_next_steps,
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
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 600,
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
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
        responseMimeType: "application/json",
      },
    })

    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description

    const prompt = `Score this startup idea from 0-100 based on market potential, feasibility, scalability, and competitive positioning.

Title: ${title}
Description: ${fullContent}

Return JSON: {"score": <number 0-100>}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()
    
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    const parsed = JSON.parse(cleanedResponse)
    const score = parsed.score

    if (typeof score !== 'number' || isNaN(score)) {
      return 50
    }

    return Math.min(100, Math.max(0, Math.round(score)))
  } catch (error) {
    console.error("Error calculating score with Gemini:", error)
    return 50
  }
}
