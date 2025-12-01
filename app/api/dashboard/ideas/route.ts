import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status !== "all") {
      query = query.eq('status', status);
    }

    const { data: ideas, error } = await query;

    if (error) {
      console.error("Error fetching user ideas:", error);
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
    }

    // Transform to match frontend expected format
    const transformedIdeas = (ideas || []).map(idea => ({
      id: idea.id,
      title: idea.title,
      original_title: idea.original_title,
      description: idea.description,
      body_text: idea.body_text,
      source: idea.source,
      user_id: idea.user_id,
      subreddit: idea.subreddit,
      author: 'You',
      upvotes: idea.upvotes || 0,
      downvotes: idea.downvotes || 0,
      comments_count: idea.comments_count || 0,
      created_at: idea.created_at,
      post_url: idea.post_url,
      thumbnail: idea.thumbnail,
      market_potential_score: idea.market_potential_score ?? 0,
      status: idea.status,
    }));

    return NextResponse.json({ ideas: transformedIdeas });
  } catch (error) {
    console.error("Error in dashboard ideas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
