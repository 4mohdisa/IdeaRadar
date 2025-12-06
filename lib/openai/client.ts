/**
 * OpenAI Client Configuration
 * 
 * Centralized OpenAI client setup for the application.
 */

import OpenAI from "openai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set - AI features will use fallback values")
}

// Singleton client instance
let clientInstance: OpenAI | null = null

export function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    return null
  }

  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: OPENAI_API_KEY,
    })
  }

  return clientInstance
}

// Model configuration
export const OPENAI_MODELS = {
  // Primary model for scoring (will be replaced with fine-tuned version)
  SCORING: "gpt-4o-mini-2024-07-18",
  
  // Fine-tuned model (set after fine-tuning is complete)
  SCORING_FINE_TUNED: process.env.OPENAI_FINE_TUNED_MODEL || null,
  
  // Model for embeddings (for future RAG implementation)
  EMBEDDING: "text-embedding-3-small",
} as const

// Get the best available scoring model
export function getScoringModel(): string {
  // Use fine-tuned model if available
  if (OPENAI_MODELS.SCORING_FINE_TUNED) {
    return OPENAI_MODELS.SCORING_FINE_TUNED
  }
  return OPENAI_MODELS.SCORING
}

export default getOpenAIClient
