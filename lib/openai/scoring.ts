/**
 * OpenAI Idea Scoring Service
 * 
 * Uses OpenAI GPT models with structured JSON output for consistent,
 * transparent scoring of startup ideas. Supports fine-tuning.
 */

import { getOpenAIClient, getScoringModel } from "./client"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"

// Score breakdown schema using Zod for type-safe parsing
const ScoreBreakdownSchema = z.object({
  market_demand: z.number().min(0).max(10).describe("Current market demand (0-10)"),
  market_timing: z.number().min(0).max(10).describe("Market timing alignment (0-10)"),
  revenue_clarity: z.number().min(0).max(10).describe("Revenue model clarity (0-10)"),
  scalability: z.number().min(0).max(10).describe("Growth potential (0-10)"),
  unique_value: z.number().min(0).max(10).describe("Unique value proposition (0-10)"),
  competitive_moat: z.number().min(0).max(10).describe("Competitive defensibility (0-10)"),
  technical_feasibility: z.number().min(0).max(10).describe("Technical buildability (0-10)"),
  execution_complexity: z.number().min(0).max(10).describe("Ease of execution (0-10)"),
  market_risk: z.number().min(0).max(10).describe("Market adoption confidence (0-10)"),
  regulatory_risk: z.number().min(0).max(10).describe("Regulatory safety (0-10)"),
})

const IdeaAnalysisSchema = z.object({
  score_breakdown: ScoreBreakdownSchema,
  ai_summary: z.string().describe("2-3 paragraph professional summary"),
  strengths: z.array(z.string()).max(3).describe("Top 3 strengths"),
  challenges: z.array(z.string()).max(3).describe("Top 3 challenges"),
  target_market: z.string().describe("Primary target market"),
  suggested_next_steps: z.array(z.string()).max(3).describe("3 actionable next steps"),
})

// Export types
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>
export type IdeaAnalysisOutput = z.infer<typeof IdeaAnalysisSchema>

export interface IdeaAnalysis extends IdeaAnalysisOutput {
  total_score: number
}

// System prompt for the AI scorer
const SYSTEM_PROMPT = `You are an expert startup analyst and venture capitalist with 20+ years of experience evaluating early-stage startups. Your role is to provide comprehensive, balanced analysis of startup ideas.

SCORING CRITERIA (each 0-10 points, total 100):

**Market & Timing (20 points)**
- market_demand: Is there a real, urgent problem? Active market demand?
- market_timing: Is now the right time? Technology/social trends aligned?

**Business Viability (20 points)**
- revenue_clarity: Clear monetization path? Obvious revenue model?
- scalability: Can this grow 10x-100x? Network effects? Viral potential?

**Competitive Position (20 points)**
- unique_value: What's truly different? Innovation level?
- competitive_moat: Defensibility? Barriers to entry? First-mover advantage?

**Execution (20 points)**
- technical_feasibility: Can it be built with current technology?
- execution_complexity: Resource requirements (10 = easy, 1 = extremely complex)

**Risk Assessment (20 points)**
- market_risk: Confidence in market adoption (10 = confident, 1 = uncertain)
- regulatory_risk: Legal/compliance safety (10 = no concerns, 1 = major hurdles)

Be critical but fair. Score based on information provided - don't assume details not mentioned. Provide actionable insights.`

function calculateTotalScore(breakdown: ScoreBreakdown): number {
  const total = 
    breakdown.market_demand +
    breakdown.market_timing +
    breakdown.revenue_clarity +
    breakdown.scalability +
    breakdown.unique_value +
    breakdown.competitive_moat +
    breakdown.technical_feasibility +
    breakdown.execution_complexity +
    breakdown.market_risk +
    breakdown.regulatory_risk
  
  return Math.min(100, Math.max(0, total))
}

function getDefaultAnalysis(description: string): IdeaAnalysis {
  return {
    total_score: 50,
    score_breakdown: {
      market_demand: 5,
      market_timing: 5,
      revenue_clarity: 5,
      scalability: 5,
      unique_value: 5,
      competitive_moat: 5,
      technical_feasibility: 5,
      execution_complexity: 5,
      market_risk: 5,
      regulatory_risk: 5,
    },
    ai_summary: description,
    strengths: ["Idea submitted for review"],
    challenges: ["Requires further analysis"],
    target_market: "To be determined",
    suggested_next_steps: ["Conduct market research", "Validate with potential customers", "Build MVP"],
  }
}

/**
 * Analyze a startup idea using OpenAI with structured output
 */
export async function analyzeIdeaWithOpenAI(
  title: string,
  description: string,
  bodyText?: string | null,
  context?: {
    source?: "reddit" | "community"
    subreddit?: string
    upvotes?: number
    comments?: number
    commentsContext?: string // Aggregated comments for training
  }
): Promise<IdeaAnalysis> {
  const client = getOpenAIClient()
  
  if (!client) {
    console.warn("OpenAI client not available, returning default analysis")
    return getDefaultAnalysis(description)
  }

  try {
    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description
    
    // Build context string
    let contextInfo = ""
    if (context?.source === "reddit") {
      contextInfo = `\n\nContext: This idea was sourced from Reddit${context.subreddit ? ` (r/${context.subreddit})` : ""}.`
      if (context.upvotes) contextInfo += ` It received ${context.upvotes} upvotes.`
      if (context.comments) contextInfo += ` It has ${context.comments} comments.`
    }
    
    // Include community discussion if available (for richer training data)
    if (context?.commentsContext) {
      contextInfo += `\n\nCommunity Discussion:\n${context.commentsContext}`
    }

    const userPrompt = `Analyze this startup idea:

Title: ${title}

Description: ${fullContent}${contextInfo}

Provide a thorough, balanced analysis with scores and insights.`

    const completion = await client.chat.completions.parse({
      model: getScoringModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(IdeaAnalysisSchema, "idea_analysis"),
      temperature: 0.3, // Lower for consistent scoring
      max_tokens: 2000,
    })

    const message = completion.choices[0]?.message

    if (message?.parsed) {
      const analysis = message.parsed
      return {
        ...analysis,
        total_score: calculateTotalScore(analysis.score_breakdown),
      }
    }

    if (message?.refusal) {
      console.warn("Model refused to analyze:", message.refusal)
      return getDefaultAnalysis(description)
    }

    return getDefaultAnalysis(description)
  } catch (error) {
    console.error("Error analyzing idea with OpenAI:", error)
    return getDefaultAnalysis(description)
  }
}

/**
 * Quick score calculation (lighter weight, for bulk processing)
 */
export async function calculateQuickScoreOpenAI(
  title: string,
  description: string
): Promise<{ score: number; summary: string }> {
  const client = getOpenAIClient()
  
  if (!client) {
    return { score: 50, summary: description }
  }

  try {
    const QuickScoreSchema = z.object({
      score: z.number().min(0).max(100),
      summary: z.string(),
    })

    const completion = await client.chat.completions.parse({
      model: getScoringModel(),
      messages: [
        { 
          role: "system", 
          content: "You are a startup idea evaluator. Score ideas from 0-100 based on market potential, feasibility, and uniqueness. Be concise." 
        },
        { 
          role: "user", 
          content: `Score this startup idea:\n\nTitle: ${title}\nDescription: ${description}\n\nProvide a score (0-100) and one paragraph summary.` 
        },
      ],
      response_format: zodResponseFormat(QuickScoreSchema, "quick_score"),
      temperature: 0.2,
      max_tokens: 500,
    })

    const message = completion.choices[0]?.message
    
    if (message?.parsed) {
      return {
        score: Math.min(100, Math.max(0, message.parsed.score)),
        summary: message.parsed.summary,
      }
    }

    return { score: 50, summary: description }
  } catch (error) {
    console.error("Error in quick score:", error)
    return { score: 50, summary: description }
  }
}

/**
 * Generate just a summary (for existing ideas that need summaries)
 */
export async function generateSummaryOpenAI(
  title: string,
  description: string,
  bodyText?: string | null
): Promise<string> {
  const client = getOpenAIClient()
  
  if (!client) {
    return description
  }

  try {
    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description

    const completion = await client.chat.completions.create({
      model: getScoringModel(),
      messages: [
        { 
          role: "system", 
          content: "You are a professional business writer. Write clear, engaging summaries of startup ideas." 
        },
        { 
          role: "user", 
          content: `Write a professional 2-3 paragraph summary for this startup idea. Include core value proposition, target market, and key strengths/challenges.\n\nTitle: ${title}\nDescription: ${fullContent}` 
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    })

    return completion.choices[0]?.message?.content?.trim() || description
  } catch (error) {
    console.error("Error generating summary:", error)
    return description
  }
}
