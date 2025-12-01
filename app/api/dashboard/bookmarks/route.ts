import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get bookmarked idea IDs
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('idea_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError);
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ ideas: [] });
    }

    // Get the actual ideas
    const ideaIds = bookmarks.map(b => b.idea_id);
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .in('id', ideaIds);

    if (ideasError) {
      console.error("Error fetching ideas:", ideasError);
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
    }

    // Transform and maintain bookmark order
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
    console.error("Error in dashboard bookmarks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
