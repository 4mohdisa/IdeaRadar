/**
 * Unified Idea Scoring Service
 * 
 * Uses Gemini 2.5 Flash with structured JSON output for consistent,
 * transparent scoring of startup ideas.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Score breakdown interface - stored for transparency
export interface ScoreBreakdown {
  // Market & Timing (0-20)
  market_demand: number        // Current market demand and problem urgency
  market_timing: number        // Is the timing right? Trends alignment
  
  // Business Viability (0-20)
  revenue_clarity: number      // Clear path to monetization
  scalability: number          // Growth potential and expansion capability
  
  // Competitive Position (0-20)
  unique_value: number         // Differentiation and innovation
  competitive_moat: number     // Barriers to entry, defensibility
  
  // Execution (0-20)
  technical_feasibility: number // Can it be built with current tech?
  execution_complexity: number  // Team/resource requirements (higher = easier)
  
  // Risk Assessment (0-20)
  market_risk: number          // Market adoption risk (higher = lower risk)
  regulatory_risk: number      // Legal/compliance risk (higher = lower risk)
}

export interface IdeaAnalysis {
  total_score: number
  score_breakdown: ScoreBreakdown
  ai_summary: string
  strengths: string[]
  challenges: string[]
  target_market: string
  suggested_next_steps: string[]
}

// JSON Schema for structured output
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    score_breakdown: {
      type: "object",
      properties: {
        market_demand: { type: "integer", description: "Current market demand (0-10)" },
        market_timing: { type: "integer", description: "Market timing alignment (0-10)" },
        revenue_clarity: { type: "integer", description: "Revenue model clarity (0-10)" },
        scalability: { type: "integer", description: "Growth potential (0-10)" },
        unique_value: { type: "integer", description: "Unique value proposition (0-10)" },
        competitive_moat: { type: "integer", description: "Competitive defensibility (0-10)" },
        technical_feasibility: { type: "integer", description: "Technical buildability (0-10)" },
        execution_complexity: { type: "integer", description: "Ease of execution (0-10)" },
        market_risk: { type: "integer", description: "Market adoption confidence (0-10)" },
        regulatory_risk: { type: "integer", description: "Regulatory safety (0-10)" }
      },
      required: [
        "market_demand", "market_timing", "revenue_clarity", "scalability",
        "unique_value", "competitive_moat", "technical_feasibility",
        "execution_complexity", "market_risk", "regulatory_risk"
      ]
    },
    ai_summary: { type: "string", description: "2-3 paragraph professional summary" },
    strengths: { 
      type: "array", 
      items: { type: "string" },
      description: "Top 3 strengths of this idea"
    },
    challenges: { 
      type: "array", 
      items: { type: "string" },
      description: "Top 3 challenges or risks"
    },
    target_market: { type: "string", description: "Primary target market description" },
    suggested_next_steps: {
      type: "array",
      items: { type: "string" },
      description: "3 actionable next steps to validate/build this idea"
    }
  },
  required: ["score_breakdown", "ai_summary", "strengths", "challenges", "target_market", "suggested_next_steps"]
}

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
  
  // Total is out of 100 (10 criteria × 10 points each)
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
      regulatory_risk: 5
    },
    ai_summary: description,
    strengths: ["Idea submitted for review"],
    challenges: ["Requires further analysis"],
    target_market: "To be determined",
    suggested_next_steps: ["Conduct market research", "Validate with potential customers", "Build MVP"]
  }
}

/**
 * Analyze a startup idea using Gemini 2.5 Flash with structured output
 */
export async function analyzeIdeaEnhanced(
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
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set, returning default analysis")
    return getDefaultAnalysis(description)
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower for more consistent scoring
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
    })

    const fullContent = bodyText ? `${description}\n\n${bodyText}` : description
    
    // Build context string for Reddit ideas
    let contextInfo = ""
    if (context?.source === "reddit") {
      contextInfo = `\n\nContext: This idea was sourced from Reddit${context.subreddit ? ` (r/${context.subreddit})` : ""}.`
      if (context.upvotes) contextInfo += ` It received ${context.upvotes} upvotes.`
      if (context.comments) contextInfo += ` It has ${context.comments} comments.`
      contextInfo += " Consider community validation signals in your analysis."
    }

    const prompt = `You are an expert startup analyst and venture capitalist with 20+ years of experience evaluating early-stage startups. Analyze the following startup idea comprehensively.

SCORING CRITERIA (each 0-10 points):

**Market & Timing (20 points total)**
- market_demand: Is there a real, urgent problem? Active market demand?
- market_timing: Is now the right time? Technology/social trends aligned?

**Business Viability (20 points total)**
- revenue_clarity: Clear monetization path? Obvious revenue model?
- scalability: Can this grow 10x-100x? Network effects? Viral potential?

**Competitive Position (20 points total)**
- unique_value: What's truly different? Innovation level?
- competitive_moat: Defensibility? Barriers to entry? First-mover advantage?

**Execution (20 points total)**
- technical_feasibility: Can it be built with current technology?
- execution_complexity: Resource requirements (10 = easy to execute, 1 = extremely complex)

**Risk Assessment (20 points total)**
- market_risk: Confidence in market adoption (10 = very confident, 1 = highly uncertain)
- regulatory_risk: Legal/compliance safety (10 = no concerns, 1 = major regulatory hurdles)

STARTUP IDEA:
Title: ${title}

Description: ${fullContent}${contextInfo}

Provide a thorough, balanced analysis. Be critical but fair. Score based on the information provided - don't assume details not mentioned.

Return your analysis as JSON matching this exact structure:
${JSON.stringify(ANALYSIS_SCHEMA.properties, null, 2)}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse JSON response
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const analysis = JSON.parse(cleanedResponse)

    // Validate and clamp all scores
    const breakdown: ScoreBreakdown = {
      market_demand: Math.min(10, Math.max(0, analysis.score_breakdown?.market_demand ?? 5)),
      market_timing: Math.min(10, Math.max(0, analysis.score_breakdown?.market_timing ?? 5)),
      revenue_clarity: Math.min(10, Math.max(0, analysis.score_breakdown?.revenue_clarity ?? 5)),
      scalability: Math.min(10, Math.max(0, analysis.score_breakdown?.scalability ?? 5)),
      unique_value: Math.min(10, Math.max(0, analysis.score_breakdown?.unique_value ?? 5)),
      competitive_moat: Math.min(10, Math.max(0, analysis.score_breakdown?.competitive_moat ?? 5)),
      technical_feasibility: Math.min(10, Math.max(0, analysis.score_breakdown?.technical_feasibility ?? 5)),
      execution_complexity: Math.min(10, Math.max(0, analysis.score_breakdown?.execution_complexity ?? 5)),
      market_risk: Math.min(10, Math.max(0, analysis.score_breakdown?.market_risk ?? 5)),
      regulatory_risk: Math.min(10, Math.max(0, analysis.score_breakdown?.regulatory_risk ?? 5)),
    }

    return {
      total_score: calculateTotalScore(breakdown),
      score_breakdown: breakdown,
      ai_summary: analysis.ai_summary || description,
      strengths: analysis.strengths?.slice(0, 3) || [],
      challenges: analysis.challenges?.slice(0, 3) || [],
      target_market: analysis.target_market || "General market",
      suggested_next_steps: analysis.suggested_next_steps?.slice(0, 3) || []
    }
  } catch (error) {
    console.error("Error analyzing idea with Gemini 2.5 Flash:", error)
    return getDefaultAnalysis(description)
  }
}

/**
 * Quick score calculation (lighter weight, for bulk processing)
 */
export async function calculateQuickScore(
  title: string,
  description: string
): Promise<{ score: number; summary: string }> {
  if (!GEMINI_API_KEY) {
    return { score: 50, summary: description }
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    })

    const prompt = `Score this startup idea from 0-100 based on market potential, feasibility, and uniqueness.

Title: ${title}
Description: ${description}

Return JSON: {"score": <number 0-100>, "summary": "<one paragraph summary>"}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedResponse)
    
    return {
      score: Math.min(100, Math.max(0, parsed.score ?? 50)),
      summary: parsed.summary || description
    }
  } catch (error) {
    console.error("Error in quick score:", error)
    return { score: 50, summary: description }
  }
}

/**
 * Generate just a summary (for existing ideas that need summaries)
 */
export async function generateEnhancedSummary(
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

    const prompt = `Write a professional 2-3 paragraph summary for this startup idea. Include:
- Core value proposition
- Target market and use cases  
- Key strengths and potential challenges

Title: ${title}
Description: ${fullContent}

Write the summary directly, no preamble:`

    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error("Error generating summary:", error)
    return description
  }
}
