import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch user profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch user's published ideas
    const { data: ideas, error: ideasError } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (ideasError) {
      console.error("Error fetching user ideas:", ideasError)
    }

    const userIdeas = ideas || []

    // Calculate analytics
    const totalIdeas = userIdeas.length
    const totalUpvotes = userIdeas.reduce((sum, idea) => sum + (idea.upvotes || 0), 0)
    const totalDownvotes = userIdeas.reduce((sum, idea) => sum + (idea.downvotes || 0), 0)
    const totalComments = userIdeas.reduce((sum, idea) => sum + (idea.comments_count || 0), 0)
    
    const scores = userIdeas.map(idea => idea.market_potential_score || 0).filter(s => s > 0)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const topScore = scores.length > 0 ? Math.max(...scores) : 0
    const sortedScores = [...scores].sort((a, b) => a - b)
    const medianScore = sortedScores.length > 0 
      ? sortedScores[Math.floor(sortedScores.length / 2)] 
      : 0

    // Build display name
    const displayName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.username || "User"

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        displayName,
        email: profile.email,
        avatarUrl: profile.image_url,
        joinedAt: profile.created_at,
      },
      analytics: {
        totalIdeas,
        totalUpvotes,
        totalDownvotes,
        totalComments,
        avgScore,
        topScore,
        medianScore,
        publishedIdeas: totalIdeas,
      },
      ideas: userIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        body_text: idea.body_text || "",
        source: idea.source,
        upvotes: idea.upvotes || 0,
        downvotes: idea.downvotes || 0,
        comments_count: idea.comments_count || 0,
        market_potential_score: idea.market_potential_score || 0,
        created_at: idea.created_at,
        author: displayName,
        status: idea.status,
      })),
    })
  } catch (error) {
    console.error("Error in profile API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
