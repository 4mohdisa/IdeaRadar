import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RouteParams {
  params: Promise<{ id: string }>
}

// Check if idea is bookmarked
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: ideaId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ isBookmarked: false })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error("Error checking bookmark:", error)
      return NextResponse.json({ isBookmarked: false })
    }

    return NextResponse.json({ isBookmarked: !!data })
  } catch (error) {
    console.error("Error in GET /api/ideas/[id]/bookmark:", error)
    return NextResponse.json({ isBookmarked: false })
  }
}

// Add bookmark
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if idea exists in database
    const { data: idea } = await supabase
      .from('ideas')
      .select('id')
      .eq('id', ideaId)
      .maybeSingle()

    if (!idea) {
      return NextResponse.json(
        { error: "Cannot bookmark this idea - it's not in the database" },
        { status: 400 }
      )
    }

    // Ensure user profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      // Create profile if it doesn't exist
      const user = await import('@clerk/nextjs/server').then(m => m.currentUser())
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
    
    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, message: "Already bookmarked" })
    }

    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        idea_id: ideaId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding bookmark:", error)
      return NextResponse.json(
        { error: "Failed to add bookmark" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      bookmark: data 
    })
  } catch (error) {
    console.error("Error in POST /api/ideas/[id]/bookmark:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Remove bookmark
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
      .from('user_bookmarks')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', userId)

    if (error) {
      console.error("Error removing bookmark:", error)
      return NextResponse.json(
        { error: "Failed to remove bookmark" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/ideas/[id]/bookmark:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
