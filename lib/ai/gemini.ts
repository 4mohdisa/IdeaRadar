/**
 * AI Service
 * 
 * Provides AI-powered scoring and summary generation for startup ideas
 * Uses OpenAI GPT models (with fine-tuning support)
 * Falls back to Gemini if OpenAI is not available
 */

import { 
  analyzeIdeaWithOpenAI, 
  generateSummaryOpenAI,
  calculateQuickScoreOpenAI,
  type ScoreBreakdown 
} from "../openai"
import { collectTrainingData } from "../openai/training"

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
 * Analyze a startup idea using OpenAI
 * Returns a market potential score (0-100), AI-generated summary, and detailed breakdown
 * Also collects training data for future fine-tuning
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
    ideaId?: string // For training data collection
    commentsContext?: string // Aggregated comments for training
  }
): Promise<IdeaAnalysis> {
  // Use OpenAI scoring service
  const analysis = await analyzeIdeaWithOpenAI(title, description, bodyText, {
    source: context?.source,
    subreddit: context?.subreddit,
    upvotes: context?.upvotes,
    comments: context?.comments,
    commentsContext: context?.commentsContext,
  })
  
  // Collect training data if we have an idea ID
  if (context?.ideaId) {
    collectTrainingData({
      ideaId: context.ideaId,
      ideaTitle: title,
      ideaDescription: description,
      ideaBody: bodyText,
      commentsContext: context.commentsContext,
      score: analysis.total_score,
      scoreBreakdown: analysis.score_breakdown,
      aiSummary: analysis.ai_summary,
      strengths: analysis.strengths,
      challenges: analysis.challenges,
      targetMarket: analysis.target_market,
      nextSteps: analysis.suggested_next_steps,
      upvotes: context.upvotes,
      commentsCount: context.comments,
      validationSource: "auto",
    }).catch(err => console.error("Failed to collect training data:", err))
  }
  
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
  return generateSummaryOpenAI(title, description, bodyText)
}

/**
 * Calculate just the market potential score for an idea
 */
export async function calculateScore(
  title: string,
  description: string,
  _bodyText?: string | null
): Promise<number> {
  const result = await calculateQuickScoreOpenAI(title, description)
  return result.score
}
