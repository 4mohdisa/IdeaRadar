import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RouteParams {
  params: Promise<{ id: string }>
}

// Get all comments for an idea
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ideaId } = await params
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('idea_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        user_id,
        profiles:user_id (
          username,
          first_name,
          last_name,
          image_url
        )
      `)
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error getting comments:", error)
      return NextResponse.json(
        { error: "Failed to get comments" },
        { status: 500 }
      )
    }

    // Transform to include author info - flatten profile data for frontend
    const comments = (data || []).map(comment => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = comment.profiles as any
      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        parent_id: comment.parent_id,
        user_id: comment.user_id,
        // Flatten profile data for the frontend component
        username: profile?.username || null,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        image_url: profile?.image_url || null,
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error in GET /api/ideas/[id]/comments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Create a new comment
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
    const { content, parent_id } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment must not exceed 2000 characters" },
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
        { error: "Cannot comment on this idea - it's not in the database" },
        { status: 400 }
      )
    }

    // Ensure user profile exists and get the profile data
    const profile = await ensureProfileExists(supabase, userId)
    
    const { data, error } = await supabase
      .from('idea_comments')
      .insert({
        idea_id: ideaId,
        user_id: userId,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      )
    }

    // Update comment count on idea
    const { data: ideaForCount } = await supabase
      .from('ideas')
      .select('comments_count')
      .eq('id', ideaId)
      .single()
    
    if (ideaForCount) {
      await supabase
        .from('ideas')
        .update({ comments_count: ((ideaForCount as { comments_count: number }).comments_count || 0) + 1 })
        .eq('id', ideaId)
    }

    // Return comment with profile data
    const commentWithProfile = {
      ...data,
      username: profile?.username || null,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      image_url: profile?.image_url || null,
    }

    return NextResponse.json({ comment: commentWithProfile }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/ideas/[id]/comments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

interface ProfileData {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  image_url: string | null
}

// Helper to ensure user profile exists and return profile data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureProfileExists(supabase: any, userId: string): Promise<ProfileData | null> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, image_url')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return existingProfile as ProfileData
  }

  // Profile doesn't exist, create it from Clerk data
  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  if (user) {
    const primaryEmail = user.emailAddresses.find(
      (email: { id: string }) => email.id === user.primaryEmailAddressId
    )?.emailAddress

    if (primaryEmail) {
      const profileData = {
        id: user.id,
        email: primaryEmail,
        username: user.username ?? null,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        image_url: user.imageUrl ?? null,
      }
      
      await supabase.from('profiles').upsert(profileData)
      
      return {
        id: user.id,
        username: user.username ?? null,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        image_url: user.imageUrl ?? null,
      }
    }
  }
  
  return null
}
