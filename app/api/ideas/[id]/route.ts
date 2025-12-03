import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: dbIdea, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error("Supabase query error:", error.message, error.code);
      return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 });
    }
    
    if (!dbIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Transform database idea to match frontend expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idea = dbIdea as any;
    
    return NextResponse.json({
      id: idea.id,
      title: idea.title,
      original_title: idea.original_title,
      description: idea.description,
      body_text: idea.body_text,
      source: idea.source,
      user_id: idea.user_id,
      subreddit: idea.subreddit,
      author: idea.reddit_author || 'User',
      upvotes: idea.upvotes || 0,
      downvotes: idea.downvotes || 0,
      comments_count: idea.comments_count || 0,
      created_at: idea.created_at,
      post_url: idea.post_url,
      thumbnail: idea.thumbnail,
      market_potential_score: idea.market_potential_score ?? 0,
      status: idea.status,
    });
  } catch (error) {
    console.error("Error fetching from Supabase:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check if the idea belongs to the user
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching idea:", fetchError);
      return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 });
    }

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (idea.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the idea
    const { error: deleteError } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Error deleting idea:", deleteError);
      return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/ideas/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, body_text, status } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First check if the idea belongs to the user
    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching idea:", fetchError);
      return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 });
    }

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (existingIdea.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate status
    const validStatuses = ['draft', 'published', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (body_text !== undefined) updateData.body_text = body_text;
    if (status !== undefined) updateData.status = status;

    // Update the idea
    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating idea:", updateError);
      return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      idea: updatedIdea 
    });
  } catch (error) {
    console.error("Error in PATCH /api/ideas/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
