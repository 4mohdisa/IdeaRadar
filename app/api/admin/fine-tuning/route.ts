/**
 * Admin API: Fine-Tuning Job Management
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { 
  createFineTuningJob, 
  listFineTuningJobs, 
  getFineTuningJobStatus,
  cancelFineTuningJob 
} from "@/lib/openai/fine-tuning"

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}

// GET - List fine-tuning jobs
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get("jobId")
  const status = searchParams.get("status") as "pending" | "uploading" | "queued" | "running" | "succeeded" | "failed" | "cancelled" | null
  const limit = parseInt(searchParams.get("limit") || "20")

  try {
    // If specific job ID requested, get its status
    if (jobId) {
      const job = await getFineTuningJobStatus(jobId)
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }
      return NextResponse.json({ job })
    }

    // Otherwise list all jobs
    const jobs = await listFineTuningJobs({
      status: status || undefined,
      limit,
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching fine-tuning jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// POST - Create new fine-tuning job
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId } = await auth()

    const result = await createFineTuningJob({
      modelBase: body.modelBase,
      hyperparameters: body.hyperparameters,
      validationSplit: body.validationSplit,
      minEngagementScore: body.minEngagementScore,
      minQualityRating: body.minQualityRating,
      notes: body.notes,
      createdBy: userId || undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ jobId: result.jobId })
  } catch (error) {
    console.error("Error creating fine-tuning job:", error)
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
  }
}

// DELETE - Cancel fine-tuning job
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get("jobId")

  if (!jobId) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 })
  }

  try {
    const success = await cancelFineTuningJob(jobId)
    
    if (!success) {
      return NextResponse.json({ error: "Failed to cancel job" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling fine-tuning job:", error)
    return NextResponse.json({ error: "Failed to cancel job" }, { status: 500 })
  }
}
