import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { analyzeIdea } from "@/lib/ai/gemini"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/ideas/[id]/analyze
 * Re-analyze an idea with AI to update its score and summary
 * Only the idea owner can trigger this
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the idea
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error("Error fetching idea:", fetchError)
      return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 })
    }

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    // Check ownership
    if (idea.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the original description (stored in original_title for user ideas)
    const originalDescription = idea.original_title || idea.description

    // Re-analyze with AI
    const analysis = await analyzeIdea(
      idea.title,
      originalDescription,
      idea.body_text
    )

    // Update the idea with new analysis
    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update({
        description: analysis.ai_summary,
        market_potential_score: analysis.market_potential_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating idea:", updateError)
      return NextResponse.json({ error: "Failed to update idea" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
      analysis: {
        score: analysis.market_potential_score,
        summary: analysis.ai_summary,
      }
    })
  } catch (error) {
    console.error("Error in POST /api/ideas/[id]/analyze:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
