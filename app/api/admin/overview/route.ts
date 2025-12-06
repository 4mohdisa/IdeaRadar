/**
 * Admin API: Dashboard Overview - Enhanced Analytics
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { getScoringModel, OPENAI_MODELS } from "@/lib/openai/client"

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
    // Date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all ideas with details
    const { data: allIdeas } = await supabase
      .from("ideas")
      .select("id, source, market_potential_score, upvotes, downvotes, comments_count, created_at, status")

    const ideas = allIdeas || []
    const ideasCount = ideas.length

    // Get users with join dates
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, created_at")

    const users = allUsers || []
    const usersCount = users.length

    // Get all comments
    const { data: allComments } = await supabase
      .from("comments")
      .select("id, created_at")

    const comments = allComments || []
    const commentsCount = comments.length

    // Get all votes
    const { data: allVotes } = await supabase
      .from("votes")
      .select("id, vote_type, created_at")

    const votes = allVotes || []
    const votesCount = votes.length
    const upvotesCount = votes.filter(v => v.vote_type === "up").length
    const downvotesCount = votes.filter(v => v.vote_type === "down").length

    // Get bookmarks count
    const { count: bookmarksCount } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })

    // Time-based analytics
    const ideasToday = ideas.filter(i => new Date(i.created_at) >= today).length
    const ideasYesterday = ideas.filter(i => {
      const d = new Date(i.created_at)
      return d >= yesterday && d < today
    }).length
    const ideasLast7Days = ideas.filter(i => new Date(i.created_at) >= sevenDaysAgo).length
    const ideasLast30Days = ideas.filter(i => new Date(i.created_at) >= thirtyDaysAgo).length

    const usersToday = users.filter(u => new Date(u.created_at) >= today).length
    const usersLast7Days = users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length
    const usersLast30Days = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length

    const commentsToday = comments.filter(c => new Date(c.created_at) >= today).length
    const commentsLast7Days = comments.filter(c => new Date(c.created_at) >= sevenDaysAgo).length

    const votesToday = votes.filter(v => new Date(v.created_at) >= today).length
    const votesLast7Days = votes.filter(v => new Date(v.created_at) >= sevenDaysAgo).length

    // Source distribution
    const sourceDistribution = {
      reddit: ideas.filter(i => i.source === "reddit").length,
      user: ideas.filter(i => i.source === "user").length,
    }

    // Status distribution
    const statusDistribution = {
      published: ideas.filter(i => i.status === "published" || !i.status).length,
      draft: ideas.filter(i => i.status === "draft").length,
      archived: ideas.filter(i => i.status === "archived").length,
    }

    // Score analytics
    const scores = ideas.map(i => i.market_potential_score || 0).filter(s => s > 0)
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const maxScore = Math.max(...scores, 0)
    const minScore = scores.length > 0 ? Math.min(...scores) : 0

    const scoreDistribution = {
      excellent: ideas.filter(i => (i.market_potential_score || 0) >= 80).length,
      good: ideas.filter(i => (i.market_potential_score || 0) >= 60 && (i.market_potential_score || 0) < 80).length,
      moderate: ideas.filter(i => (i.market_potential_score || 0) >= 40 && (i.market_potential_score || 0) < 60).length,
      low: ideas.filter(i => (i.market_potential_score || 0) > 0 && (i.market_potential_score || 0) < 40).length,
      unscored: ideas.filter(i => !i.market_potential_score || i.market_potential_score === 0).length,
    }

    // Engagement analytics
    const totalUpvotes = ideas.reduce((sum, i) => sum + (i.upvotes || 0), 0)
    const totalDownvotes = ideas.reduce((sum, i) => sum + (i.downvotes || 0), 0)
    const totalIdeaComments = ideas.reduce((sum, i) => sum + (i.comments_count || 0), 0)
    const avgUpvotesPerIdea = ideasCount > 0 ? totalUpvotes / ideasCount : 0
    const avgCommentsPerIdea = ideasCount > 0 ? totalIdeaComments / ideasCount : 0

    // Top performing ideas
    const topIdeasByScore = [...ideas]
      .sort((a, b) => (b.market_potential_score || 0) - (a.market_potential_score || 0))
      .slice(0, 5)
      .map(i => ({ id: i.id, score: i.market_potential_score }))

    const topIdeasByEngagement = [...ideas]
      .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)))
      .slice(0, 5)
      .map(i => ({ id: i.id, netVotes: (i.upvotes || 0) - (i.downvotes || 0) }))

    // Get training data stats
    const { data: trainingData } = await supabase
      .from("training_data")
      .select("is_validated, included_in_training, engagement_score, score, created_at")

    const training = trainingData || []
    const trainingStats = {
      total: training.length,
      validated: training.filter(t => t.is_validated).length,
      trained: training.filter(t => t.included_in_training).length,
      pendingValidation: training.filter(t => !t.is_validated).length,
      readyForTraining: training.filter(t => t.is_validated && !t.included_in_training).length,
      avgEngagement: training.length > 0 
        ? Math.round(training.reduce((sum, t) => sum + (t.engagement_score || 0), 0) / training.length * 100) / 100
        : 0,
      recentlyAdded: training.filter(t => new Date(t.created_at) >= sevenDaysAgo).length,
    }

    // Get fine-tuning jobs
    const { data: fineTuningJobs } = await supabase
      .from("fine_tuning_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    const jobs = fineTuningJobs || []
    const latestFineTunedModel = jobs.find(j => j.model_fine_tuned)?.model_fine_tuned || null
    const successfulJobs = jobs.filter(j => j.status === "succeeded").length
    const failedJobs = jobs.filter(j => j.status === "failed").length
    const runningJobs = jobs.filter(j => j.status === "running" || j.status === "queued").length

    // Growth calculations
    const ideasGrowth = ideasYesterday > 0 ? ((ideasToday - ideasYesterday) / ideasYesterday * 100) : 0

    return NextResponse.json({
      platform: {
        ideas: {
          total: ideasCount,
          today: ideasToday,
          yesterday: ideasYesterday,
          last7Days: ideasLast7Days,
          last30Days: ideasLast30Days,
          growth: Math.round(ideasGrowth),
        },
        users: {
          total: usersCount,
          today: usersToday,
          last7Days: usersLast7Days,
          last30Days: usersLast30Days,
        },
        comments: {
          total: commentsCount,
          today: commentsToday,
          last7Days: commentsLast7Days,
        },
        votes: {
          total: votesCount,
          upvotes: upvotesCount,
          downvotes: downvotesCount,
          today: votesToday,
          last7Days: votesLast7Days,
        },
        bookmarks: bookmarksCount || 0,
        sourceDistribution,
        statusDistribution,
      },
      scores: {
        average: Math.round(avgScore * 10) / 10,
        max: maxScore,
        min: minScore,
        distribution: scoreDistribution,
      },
      engagement: {
        totalUpvotes,
        totalDownvotes,
        totalComments: totalIdeaComments,
        avgUpvotesPerIdea: Math.round(avgUpvotesPerIdea * 10) / 10,
        avgCommentsPerIdea: Math.round(avgCommentsPerIdea * 10) / 10,
        topByScore: topIdeasByScore,
        topByEngagement: topIdeasByEngagement,
      },
      training: trainingStats,
      ai: {
        currentModel: getScoringModel(),
        baseModel: OPENAI_MODELS.SCORING,
        fineTunedModel: OPENAI_MODELS.SCORING_FINE_TUNED || latestFineTunedModel,
        hasFineTunedModel: !!(OPENAI_MODELS.SCORING_FINE_TUNED || latestFineTunedModel),
      },
      fineTuning: {
        totalJobs: jobs.length,
        successful: successfulJobs,
        failed: failedJobs,
        running: runningJobs,
        recentJobs: jobs.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("Error fetching admin overview:", error)
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 })
  }
}
