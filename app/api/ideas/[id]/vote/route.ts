import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RouteParams {
  params: Promise<{ id: string }>
}

// Get user's vote on an idea
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ideaId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ vote: null })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('idea_votes')
      .select('vote_type')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error("Error getting vote:", error)
      return NextResponse.json({ vote: null })
    }

    return NextResponse.json({ 
      vote: data ? (data.vote_type === 1 ? 'up' : 'down') : null 
    })
  } catch (error) {
    console.error("Error in GET /api/ideas/[id]/vote:", error)
    return NextResponse.json({ vote: null })
  }
}

// Cast or update a vote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ideaId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { voteType } = body

    if (voteType !== 'up' && voteType !== 'down') {
      return NextResponse.json(
        { error: "Invalid vote type. Must be 'up' or 'down'" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if idea exists in database
    const { data: idea } = await supabase
      .from('ideas')
      .select('id')
      .eq('id', ideaId)
      .maybeSingle()

    if (!idea) {
      return NextResponse.json(
        { error: "Cannot vote on this idea - it's not in the database" },
        { status: 400 }
      )
    }

    // Ensure user profile exists
    await ensureProfileExists(supabase, userId)

    const voteValue = voteType === 'up' ? 1 : -1

    // Upsert the vote (insert or update if exists)
    const { data, error } = await supabase
      .from('idea_votes')
      .upsert({
        idea_id: ideaId,
        user_id: userId,
        vote_type: voteValue,
      }, {
        onConflict: 'idea_id,user_id'
      })
      .select()
      .single()

    if (error) {
      console.error("Error casting vote:", error)
      return NextResponse.json(
        { error: "Failed to cast vote" },
        { status: 500 }
      )
    }

    // Update the idea's vote counts
    await updateIdeaVoteCounts(supabase, ideaId)

    return NextResponse.json({ 
      success: true, 
      vote: data 
    })
  } catch (error) {
    console.error("Error in POST /api/ideas/[id]/vote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Remove a vote
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ideaId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase
      .from('idea_votes')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId)

    if (error) {
      console.error("Error removing vote:", error)
      return NextResponse.json(
        { error: "Failed to remove vote" },
        { status: 500 }
      )
    }

    // Update the idea's vote counts
    await updateIdeaVoteCounts(supabase, ideaId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/ideas/[id]/vote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper to update idea vote counts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateIdeaVoteCounts(supabase: any, ideaId: string) {
  const { data: votes } = await supabase
    .from('idea_votes')
    .select('vote_type')
    .eq('idea_id', ideaId)

  const upvotes = (votes || []).filter((v: { vote_type: number }) => v.vote_type === 1).length
  const downvotes = (votes || []).filter((v: { vote_type: number }) => v.vote_type === -1).length

  await supabase
    .from('ideas')
    .update({ upvotes, downvotes })
    .eq('id', ideaId)
}

// Helper to ensure user profile exists
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureProfileExists(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    const { currentUser } = await import('@clerk/nextjs/server')
    const user = await currentUser()
    if (user) {
      const primaryEmail = user.emailAddresses.find(
        email => email.id === user.primaryEmailAddressId
      )?.emailAddress

      if (primaryEmail) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: primaryEmail,
          username: user.username ?? null,
          first_name: user.firstName ?? null,
          last_name: user.lastName ?? null,
          image_url: user.imageUrl ?? null,
        })
      }
    }
  }
}
