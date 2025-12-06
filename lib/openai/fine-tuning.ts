/**
 * OpenAI Fine-Tuning Job Management
 * 
 * Handles creating, monitoring, and managing fine-tuning jobs.
 */

import { createClient } from "@supabase/supabase-js"
import { getOpenAIClient } from "./client"
import { exportTrainingDataAsJSONL, markAsTrainedData, getValidatedTrainingData } from "./training"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface FineTuningJobRecord {
  id: string
  openaiJobId: string | null
  modelBase: string
  modelFineTuned: string | null
  trainingFileId: string | null
  validationFileId: string | null
  hyperparameters: Record<string, unknown> | null
  status: "pending" | "uploading" | "queued" | "running" | "succeeded" | "failed" | "cancelled"
  errorMessage: string | null
  trainingExamplesCount: number | null
  validationExamplesCount: number | null
  trainedTokens: number | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  createdBy: string | null
}

export interface CreateFineTuningJobOptions {
  modelBase?: string
  hyperparameters?: {
    nEpochs?: number
    batchSize?: number
    learningRateMultiplier?: number
  }
  validationSplit?: number // Percentage of data to use for validation (0-0.5)
  minEngagementScore?: number
  minQualityRating?: number
  notes?: string
  createdBy?: string
}

/**
 * Create a new fine-tuning job
 */
export async function createFineTuningJob(
  options: CreateFineTuningJobOptions = {}
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const client = getOpenAIClient()
  const supabase = getSupabaseAdmin()

  if (!client) {
    return { success: false, error: "OpenAI client not available" }
  }

  try {
    // Get validated training data
    const trainingData = await getValidatedTrainingData({
      excludeAlreadyTrained: true,
      minEngagementScore: options.minEngagementScore,
      minQualityRating: options.minQualityRating,
    })

    if (trainingData.length < 10) {
      return { 
        success: false, 
        error: `Insufficient training data. Need at least 10 examples, have ${trainingData.length}` 
      }
    }

    // Create job record in database
    const { data: jobRecord, error: dbError } = await supabase
      .from("fine_tuning_jobs")
      .insert({
        model_base: options.modelBase || "gpt-4o-mini-2024-07-18",
        status: "uploading",
        hyperparameters: options.hyperparameters || null,
        training_examples_count: trainingData.length,
        notes: options.notes || null,
        created_by: options.createdBy || null,
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Export training data as JSONL
    const jsonlContent = await exportTrainingDataAsJSONL({
      excludeAlreadyTrained: true,
      minEngagementScore: options.minEngagementScore,
      minQualityRating: options.minQualityRating,
    })

    // Split into training and validation if requested
    const lines = jsonlContent.split("\n").filter(line => line.trim())
    let trainingLines = lines
    let validationLines: string[] = []

    if (options.validationSplit && options.validationSplit > 0) {
      const splitIndex = Math.floor(lines.length * (1 - options.validationSplit))
      trainingLines = lines.slice(0, splitIndex)
      validationLines = lines.slice(splitIndex)
    }

    // Upload training file to OpenAI
    const trainingBlob = new Blob([trainingLines.join("\n")], { type: "application/jsonl" })
    const trainingFile = new File([trainingBlob], "training_data.jsonl")

    const uploadedTrainingFile = await client.files.create({
      file: trainingFile,
      purpose: "fine-tune",
    })

    // Upload validation file if we have one
    let uploadedValidationFile = null
    if (validationLines.length >= 10) {
      const validationBlob = new Blob([validationLines.join("\n")], { type: "application/jsonl" })
      const validationFile = new File([validationBlob], "validation_data.jsonl")

      uploadedValidationFile = await client.files.create({
        file: validationFile,
        purpose: "fine-tune",
      })
    }

    // Update job record with file IDs
    await supabase
      .from("fine_tuning_jobs")
      .update({
        training_file_id: uploadedTrainingFile.id,
        validation_file_id: uploadedValidationFile?.id || null,
        validation_examples_count: validationLines.length,
        status: "queued",
      })
      .eq("id", jobRecord.id)

    // Create fine-tuning job with OpenAI
    const fineTuneJob = await client.fineTuning.jobs.create({
      model: options.modelBase || "gpt-4o-mini-2024-07-18",
      training_file: uploadedTrainingFile.id,
      validation_file: uploadedValidationFile?.id,
      hyperparameters: options.hyperparameters ? {
        n_epochs: options.hyperparameters.nEpochs,
        batch_size: options.hyperparameters.batchSize,
        learning_rate_multiplier: options.hyperparameters.learningRateMultiplier,
      } : undefined,
      suffix: "idearadar",
    })

    // Update job record with OpenAI job ID
    await supabase
      .from("fine_tuning_jobs")
      .update({
        openai_job_id: fineTuneJob.id,
        status: fineTuneJob.status as FineTuningJobRecord["status"],
        started_at: new Date().toISOString(),
      })
      .eq("id", jobRecord.id)

    // Mark training data as used
    const trainingDataIds = trainingData.map(d => d.id)
    const batchName = `batch_${new Date().toISOString().split("T")[0]}`
    await markAsTrainedData(trainingDataIds, fineTuneJob.id, batchName)

    return { success: true, jobId: jobRecord.id }
  } catch (error) {
    console.error("Error creating fine-tuning job:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

/**
 * Get fine-tuning job status from OpenAI and update database
 */
export async function getFineTuningJobStatus(
  jobId: string
): Promise<FineTuningJobRecord | null> {
  const client = getOpenAIClient()
  const supabase = getSupabaseAdmin()

  if (!client) {
    return null
  }

  try {
    // Get job from database
    const { data: jobRecord, error: dbError } = await supabase
      .from("fine_tuning_jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (dbError || !jobRecord) return null

    // If job has OpenAI ID, fetch latest status
    if (jobRecord.openai_job_id) {
      const openaiJob = await client.fineTuning.jobs.retrieve(jobRecord.openai_job_id)

      // Update database with latest status
      const updates: Record<string, unknown> = {
        status: openaiJob.status,
        trained_tokens: openaiJob.trained_tokens,
      }

      if (openaiJob.fine_tuned_model) {
        updates.model_fine_tuned = openaiJob.fine_tuned_model
      }

      if (openaiJob.status === "succeeded" || openaiJob.status === "failed" || openaiJob.status === "cancelled") {
        updates.completed_at = new Date().toISOString()
      }

      if (openaiJob.error) {
        updates.error_message = openaiJob.error.message
      }

      await supabase
        .from("fine_tuning_jobs")
        .update(updates)
        .eq("id", jobId)

      // Return updated record
      const { data: updatedRecord } = await supabase
        .from("fine_tuning_jobs")
        .select("*")
        .eq("id", jobId)
        .single()

      return updatedRecord ? mapToFineTuningJobRecord(updatedRecord) : null
    }

    return mapToFineTuningJobRecord(jobRecord)
  } catch (error) {
    console.error("Error getting fine-tuning job status:", error)
    return null
  }
}

/**
 * List all fine-tuning jobs
 */
export async function listFineTuningJobs(
  options?: {
    status?: FineTuningJobRecord["status"]
    limit?: number
  }
): Promise<FineTuningJobRecord[]> {
  const supabase = getSupabaseAdmin()

  try {
    let query = supabase
      .from("fine_tuning_jobs")
      .select("*")
      .order("created_at", { ascending: false })

    if (options?.status) {
      query = query.eq("status", options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(mapToFineTuningJobRecord)
  } catch (error) {
    console.error("Error listing fine-tuning jobs:", error)
    return []
  }
}

/**
 * Cancel a fine-tuning job
 */
export async function cancelFineTuningJob(jobId: string): Promise<boolean> {
  const client = getOpenAIClient()
  const supabase = getSupabaseAdmin()

  if (!client) return false

  try {
    // Get job from database
    const { data: jobRecord } = await supabase
      .from("fine_tuning_jobs")
      .select("openai_job_id")
      .eq("id", jobId)
      .single()

    if (!jobRecord?.openai_job_id) return false

    // Cancel with OpenAI
    await client.fineTuning.jobs.cancel(jobRecord.openai_job_id)

    // Update database
    await supabase
      .from("fine_tuning_jobs")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    return true
  } catch (error) {
    console.error("Error cancelling fine-tuning job:", error)
    return false
  }
}

/**
 * Get the latest successful fine-tuned model ID
 */
export async function getLatestFineTunedModel(): Promise<string | null> {
  const supabase = getSupabaseAdmin()

  try {
    const { data } = await supabase
      .from("fine_tuning_jobs")
      .select("model_fine_tuned")
      .eq("status", "succeeded")
      .not("model_fine_tuned", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single()

    return data?.model_fine_tuned || null
  } catch {
    return null
  }
}

// Helper function to map database record to TypeScript interface
function mapToFineTuningJobRecord(data: Record<string, unknown>): FineTuningJobRecord {
  return {
    id: data.id as string,
    openaiJobId: data.openai_job_id as string | null,
    modelBase: data.model_base as string,
    modelFineTuned: data.model_fine_tuned as string | null,
    trainingFileId: data.training_file_id as string | null,
    validationFileId: data.validation_file_id as string | null,
    hyperparameters: data.hyperparameters as Record<string, unknown> | null,
    status: data.status as FineTuningJobRecord["status"],
    errorMessage: data.error_message as string | null,
    trainingExamplesCount: data.training_examples_count as number | null,
    validationExamplesCount: data.validation_examples_count as number | null,
    trainedTokens: data.trained_tokens as number | null,
    createdAt: data.created_at as string,
    startedAt: data.started_at as string | null,
    completedAt: data.completed_at as string | null,
    notes: data.notes as string | null,
    createdBy: data.created_by as string | null,
  }
}
