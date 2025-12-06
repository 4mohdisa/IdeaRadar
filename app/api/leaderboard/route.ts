import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overall"
    const period = searchParams.get("period") || "week"

    // Calculate date filter based on period
    let dateFilter: Date | null = null
    const now = new Date()
    
    switch (period) {
      case "today":
        dateFilter = new Date(now.setHours(0, 0, 0, 0))
        break
      case "week":
        dateFilter = new Date(now.setDate(now.getDate() - 7))
        break
      case "month":
        dateFilter = new Date(now.setMonth(now.getMonth() - 1))
        break
      case "all":
      default:
        dateFilter = null
    }

    // Build query
    let query = supabase
      .from("ideas")
      .select("id, title, description, source, subreddit, market_potential_score, upvotes, downvotes, comments_count, created_at")
      .eq("status", "published")

    // Filter by source type
    if (type === "reddit") {
      query = query.eq("source", "reddit")
    } else if (type === "community") {
      query = query.eq("source", "community")
    }

    // Filter by date
    if (dateFilter) {
      query = query.gte("created_at", dateFilter.toISOString())
    }

    // Order by net score (upvotes - downvotes) and market potential
    query = query
      .order("upvotes", { ascending: false })
      .limit(50)

    const { data: ideas, error } = await query

    if (error) {
      console.error("Error fetching leaderboard:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    // Calculate net score and rank
    const rankedIdeas = (ideas || [])
      .map((idea) => ({
        ...idea,
        net_score: idea.upvotes - idea.downvotes,
      }))
      .sort((a, b) => {
        // Sort by net_score first, then by market_potential_score
        if (b.net_score !== a.net_score) {
          return b.net_score - a.net_score
        }
        return b.market_potential_score - a.market_potential_score
      })
      .map((idea, index) => ({
        ...idea,
        rank: index + 1,
      }))

    return NextResponse.json({
      ideas: rankedIdeas,
      type,
      period,
    })
  } catch (error) {
    console.error("Error in leaderboard API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
