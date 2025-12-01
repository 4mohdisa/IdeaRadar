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
    const type = searchParams.get("type") || "upvoted";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let ideaIds: string[] = [];

    if (type === "upvoted" || type === "downvoted") {
      // Get voted idea IDs - vote_type is 1 for upvote, -1 for downvote
      const voteType = type === "upvoted" ? 1 : -1;
      const { data: votes, error: votesError } = await supabase
        .from('idea_votes')
        .select('idea_id')
        .eq('user_id', userId)
        .eq('vote_type', voteType)
        .order('created_at', { ascending: false });

      if (votesError) {
        console.error("Error fetching votes:", votesError);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
      }

      ideaIds = (votes || []).map(v => v.idea_id);
    } else if (type === "commented") {
      // Get commented idea IDs (distinct)
      const { data: comments, error: commentsError } = await supabase
        .from('idea_comments')
        .select('idea_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
      }

      // Get unique idea IDs while maintaining order
      const seen = new Set<string>();
      ideaIds = (comments || [])
        .map(c => c.idea_id)
        .filter(id => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
    }

    if (ideaIds.length === 0) {
      return NextResponse.json({ ideas: [] });
    }

    // Get the actual ideas
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .in('id', ideaIds);

    if (ideasError) {
      console.error("Error fetching ideas:", ideasError);
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
    }

    // Transform and maintain order
    const ideasMap = new Map((ideas || []).map(idea => [idea.id, idea]));
    const transformedIdeas = ideaIds
      .map(id => ideasMap.get(id))
      .filter(Boolean)
      .map(idea => ({
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
      }));

    return NextResponse.json({ ideas: transformedIdeas });
  } catch (error) {
    console.error("Error in dashboard activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
