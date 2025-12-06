/**
 * Admin API: Training Data Statistics
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    // Get all training data for stats
    const { data: allData, error } = await supabase
      .from("training_data")
      .select("is_validated, included_in_training, engagement_score, validation_source, quality_rating, score, created_at")

    if (error) throw error

    const records = allData || []
    
    // Calculate stats
    const total = records.length
    const validated = records.filter(r => r.is_validated).length
    const trained = records.filter(r => r.included_in_training).length
    const pendingValidation = records.filter(r => !r.is_validated).length
    const readyForTraining = records.filter(r => r.is_validated && !r.included_in_training).length

    // Engagement stats
    const engagementScores = records.map(r => r.engagement_score || 0)
    const avgEngagementScore = engagementScores.length > 0
      ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
      : 0
    const maxEngagementScore = Math.max(...engagementScores, 0)
    const minEngagementScore = Math.min(...engagementScores.filter(s => s > 0), 0)

    // Score distribution
    const scoreDistribution = {
      excellent: records.filter(r => r.score >= 80).length,
      good: records.filter(r => r.score >= 60 && r.score < 80).length,
      moderate: records.filter(r => r.score >= 40 && r.score < 60).length,
      low: records.filter(r => r.score < 40).length,
    }

    // By validation source
    const byValidationSource: Record<string, number> = {}
    records.forEach(r => {
      const source = r.validation_source || "none"
      byValidationSource[source] = (byValidationSource[source] || 0) + 1
    })

    // Quality rating distribution
    const qualityDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "unrated": 0 }
    records.forEach(r => {
      if (r.quality_rating) {
        qualityDistribution[r.quality_rating.toString()] = (qualityDistribution[r.quality_rating.toString()] || 0) + 1
      } else {
        qualityDistribution["unrated"]++
      }
    })

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRecords = records.filter(r => new Date(r.created_at) > sevenDaysAgo)

    return NextResponse.json({
      overview: {
        total,
        validated,
        trained,
        pendingValidation,
        readyForTraining,
      },
      engagement: {
        average: Math.round(avgEngagementScore * 100) / 100,
        max: maxEngagementScore,
        min: minEngagementScore,
      },
      scoreDistribution,
      byValidationSource,
      qualityDistribution,
      recentActivity: {
        last7Days: recentRecords.length,
        validatedLast7Days: recentRecords.filter(r => r.is_validated).length,
      },
    })
  } catch (error) {
    console.error("Error fetching training data stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
