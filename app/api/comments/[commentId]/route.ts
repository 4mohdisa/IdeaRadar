import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RouteParams {
  params: Promise<{ commentId: string }>
}

// Update a comment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { commentId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

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
    
    // Check if user owns the comment
    const { data: existingComment } = await supabase
      .from('idea_comments')
      .select('user_id')
      .eq('id', parseInt(commentId))
      .maybeSingle()
    
    if (!existingComment || existingComment.user_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to edit this comment" },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('idea_comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', parseInt(commentId))
      .select()
      .single()

    if (error) {
      console.error("Error updating comment:", error)
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment: data })
  } catch (error) {
    console.error("Error in PATCH /api/comments/[commentId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Delete a comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { commentId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if user owns the comment
    const { data: existingComment } = await supabase
      .from('idea_comments')
      .select('user_id, idea_id')
      .eq('id', parseInt(commentId))
      .maybeSingle()
    
    if (!existingComment || existingComment.user_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('idea_comments')
      .delete()
      .eq('id', parseInt(commentId))

    if (error) {
      console.error("Error deleting comment:", error)
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      )
    }

    // Update comment count on idea
    const { data: idea } = await supabase
      .from('ideas')
      .select('comments_count')
      .eq('id', existingComment.idea_id)
      .single()
    
    if (idea) {
      await supabase
        .from('ideas')
        .update({ comments_count: Math.max(0, (idea.comments_count || 1) - 1) })
        .eq('id', existingComment.idea_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/comments/[commentId]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
