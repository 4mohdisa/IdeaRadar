/**
 * Admin API: Training Data Management
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin user IDs (add your Clerk user ID here)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}

// GET - List training data
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const validated = searchParams.get("validated")
  const trained = searchParams.get("trained")
  const sortBy = searchParams.get("sortBy") || "created_at"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  try {
    let query = supabase
      .from("training_data")
      .select("*", { count: "exact" })

    if (validated === "true") {
      query = query.eq("is_validated", true)
    } else if (validated === "false") {
      query = query.eq("is_validated", false)
    }

    if (trained === "true") {
      query = query.eq("included_in_training", true)
    } else if (trained === "false") {
      query = query.eq("included_in_training", false)
    }

    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching training data:", error)
    return NextResponse.json({ error: "Failed to fetch training data" }, { status: 500 })
  }
}

// PATCH - Update training data (validate, rate, etc.)
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {}
    if (updates.isValidated !== undefined) dbUpdates.is_validated = updates.isValidated
    if (updates.validationSource !== undefined) dbUpdates.validation_source = updates.validationSource
    if (updates.qualityRating !== undefined) dbUpdates.quality_rating = updates.qualityRating
    if (updates.includedInTraining !== undefined) dbUpdates.included_in_training = updates.includedInTraining

    const { data, error } = await supabase
      .from("training_data")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error updating training data:", error)
    return NextResponse.json({ error: "Failed to update training data" }, { status: 500 })
  }
}

// DELETE - Remove training data
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from("training_data")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting training data:", error)
    return NextResponse.json({ error: "Failed to delete training data" }, { status: 500 })
  }
}
