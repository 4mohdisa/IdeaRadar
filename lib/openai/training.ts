/**
 * Training Data Collection Service
 * 
 * Collects and manages training data for OpenAI fine-tuning.
 * Includes idea content, AI analysis, and community engagement signals.
 */

import { createClient } from "@supabase/supabase-js"
import type { ScoreBreakdown } from "./scoring"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface TrainingDataInput {
  ideaId: string
  ideaTitle: string
  ideaDescription: string
  ideaBody?: string | null
  commentsContext?: string | null
  score: number
  scoreBreakdown?: ScoreBreakdown | null
  aiSummary?: string | null
  strengths?: string[] | null
  challenges?: string[] | null
  targetMarket?: string | null
  nextSteps?: string[] | null
  upvotes?: number
  downvotes?: number
  commentsCount?: number
  bookmarksCount?: number
  validationSource?: "manual" | "engagement" | "expert" | "auto"
  qualityRating?: number
}

export interface TrainingDataRecord extends TrainingDataInput {
  id: string
  engagementScore: number
  isValidated: boolean
  includedInTraining: boolean
  trainingJobId?: string | null
  trainingBatch?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Collect training data for an idea
 */
export async function collectTrainingData(input: TrainingDataInput): Promise<TrainingDataRecord | null> {
  const supabase = getSupabaseAdmin()

  try {
    // Check if training data already exists for this idea
    const { data: existing } = await supabase
      .from("training_data")
      .select("id")
      .eq("idea_id", input.ideaId)
      .single()

    const trainingData = {
      idea_id: input.ideaId,
      idea_title: input.ideaTitle,
      idea_description: input.ideaDescription,
      idea_body: input.ideaBody || null,
      comments_context: input.commentsContext || null,
      score: input.score,
      score_breakdown: input.scoreBreakdown || null,
      ai_summary: input.aiSummary || null,
      strengths: input.strengths || null,
      challenges: input.challenges || null,
      target_market: input.targetMarket || null,
      next_steps: input.nextSteps || null,
      upvotes: input.upvotes || 0,
      downvotes: input.downvotes || 0,
      comments_count: input.commentsCount || 0,
      bookmarks_count: input.bookmarksCount || 0,
      validation_source: input.validationSource || "auto",
      quality_rating: input.qualityRating || null,
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("training_data")
        .update(trainingData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      return mapToTrainingDataRecord(data)
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("training_data")
        .insert(trainingData)
        .select()
        .single()

      if (error) throw error
      return mapToTrainingDataRecord(data)
    }
  } catch (error) {
    console.error("Error collecting training data:", error)
    return null
  }
}

/**
 * Update training data with engagement metrics
 */
export async function updateTrainingDataEngagement(
  ideaId: string,
  metrics: {
    upvotes?: number
    downvotes?: number
    commentsCount?: number
    bookmarksCount?: number
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  try {
    const { error } = await supabase
      .from("training_data")
      .update({
        upvotes: metrics.upvotes,
        downvotes: metrics.downvotes,
        comments_count: metrics.commentsCount,
        bookmarks_count: metrics.bookmarksCount,
      })
      .eq("idea_id", ideaId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating training data engagement:", error)
    return false
  }
}

/**
 * Add comments context to training data
 */
export async function addCommentsContext(
  ideaId: string,
  commentsContext: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  try {
    const { error } = await supabase
      .from("training_data")
      .update({ comments_context: commentsContext })
      .eq("idea_id", ideaId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error adding comments context:", error)
    return false
  }
}

/**
 * Get validated training data ready for export
 */
export async function getValidatedTrainingData(
  options?: {
    minEngagementScore?: number
    minQualityRating?: number
    excludeAlreadyTrained?: boolean
    limit?: number
  }
): Promise<TrainingDataRecord[]> {
  const supabase = getSupabaseAdmin()

  try {
    let query = supabase
      .from("training_data")
      .select("*")
      .eq("is_validated", true)

    if (options?.excludeAlreadyTrained) {
      query = query.eq("included_in_training", false)
    }

    if (options?.minEngagementScore) {
      query = query.gte("engagement_score", options.minEngagementScore)
    }

    if (options?.minQualityRating) {
      query = query.gte("quality_rating", options.minQualityRating)
    }

    query = query.order("engagement_score", { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(mapToTrainingDataRecord)
  } catch (error) {
    console.error("Error getting validated training data:", error)
    return []
  }
}

/**
 * Export training data as JSONL format for OpenAI fine-tuning
 */
export async function exportTrainingDataAsJSONL(
  options?: {
    minEngagementScore?: number
    minQualityRating?: number
    excludeAlreadyTrained?: boolean
    limit?: number
  }
): Promise<string> {
  const data = await getValidatedTrainingData(options)

  const systemPrompt = `You are an expert startup analyst and venture capitalist. Analyze startup ideas and provide comprehensive scoring across 10 criteria (0-10 each), a professional summary, strengths, challenges, target market, and next steps.`

  const jsonlLines = data.map(record => {
    // Build user message with idea content and comments
    let userContent = `Analyze this startup idea:\n\nTitle: ${record.ideaTitle}\n\nDescription: ${record.ideaDescription}`
    
    if (record.ideaBody) {
      userContent += `\n\n${record.ideaBody}`
    }
    
    if (record.commentsContext) {
      userContent += `\n\nCommunity Discussion:\n${record.commentsContext}`
    }

    // Build assistant response (the "correct" output we want the model to learn)
    const assistantContent = JSON.stringify({
      score_breakdown: record.scoreBreakdown,
      ai_summary: record.aiSummary || record.ideaDescription,
      strengths: record.strengths || [],
      challenges: record.challenges || [],
      target_market: record.targetMarket || "General market",
      suggested_next_steps: record.nextSteps || [],
    })

    const trainingExample = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
        { role: "assistant", content: assistantContent },
      ],
    }

    return JSON.stringify(trainingExample)
  })

  return jsonlLines.join("\n")
}

/**
 * Mark training data as included in a training job
 */
export async function markAsTrainedData(
  ids: string[],
  trainingJobId: string,
  trainingBatch: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  try {
    const { error } = await supabase
      .from("training_data")
      .update({
        included_in_training: true,
        training_job_id: trainingJobId,
        training_batch: trainingBatch,
      })
      .in("id", ids)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error marking training data:", error)
    return false
  }
}

/**
 * Get training data statistics
 */
export async function getTrainingDataStats(): Promise<{
  total: number
  validated: number
  trained: number
  avgEngagementScore: number
  byValidationSource: Record<string, number>
}> {
  const supabase = getSupabaseAdmin()

  try {
    const { data: allData, error } = await supabase
      .from("training_data")
      .select("is_validated, included_in_training, engagement_score, validation_source")

    if (error) throw error

    const records = allData || []
    const total = records.length
    const validated = records.filter(r => r.is_validated).length
    const trained = records.filter(r => r.included_in_training).length
    const avgEngagementScore = records.length > 0
      ? records.reduce((sum, r) => sum + (r.engagement_score || 0), 0) / records.length
      : 0

    const byValidationSource: Record<string, number> = {}
    records.forEach(r => {
      if (r.validation_source) {
        byValidationSource[r.validation_source] = (byValidationSource[r.validation_source] || 0) + 1
      }
    })

    return {
      total,
      validated,
      trained,
      avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
      byValidationSource,
    }
  } catch (error) {
    console.error("Error getting training data stats:", error)
    return {
      total: 0,
      validated: 0,
      trained: 0,
      avgEngagementScore: 0,
      byValidationSource: {},
    }
  }
}

// Helper function to map database record to TypeScript interface
function mapToTrainingDataRecord(data: Record<string, unknown>): TrainingDataRecord {
  return {
    id: data.id as string,
    ideaId: data.idea_id as string,
    ideaTitle: data.idea_title as string,
    ideaDescription: data.idea_description as string,
    ideaBody: data.idea_body as string | null,
    commentsContext: data.comments_context as string | null,
    score: data.score as number,
    scoreBreakdown: data.score_breakdown as ScoreBreakdown | null,
    aiSummary: data.ai_summary as string | null,
    strengths: data.strengths as string[] | null,
    challenges: data.challenges as string[] | null,
    targetMarket: data.target_market as string | null,
    nextSteps: data.next_steps as string[] | null,
    upvotes: data.upvotes as number,
    downvotes: data.downvotes as number,
    commentsCount: data.comments_count as number,
    bookmarksCount: data.bookmarks_count as number,
    engagementScore: data.engagement_score as number,
    isValidated: data.is_validated as boolean,
    validationSource: data.validation_source as "manual" | "engagement" | "expert" | "auto" | undefined,
    qualityRating: data.quality_rating as number | undefined,
    includedInTraining: data.included_in_training as boolean,
    trainingJobId: data.training_job_id as string | null,
    trainingBatch: data.training_batch as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}
