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

    // Get user's ideas stats
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('id, status, upvotes, comments_count')
      .eq('user_id', userId);

    if (ideasError) {
      console.error("Error fetching ideas:", ideasError);
    }

    // Get user's votes
    const { data: votes, error: votesError } = await supabase
      .from('idea_votes')
      .select('vote_type')
      .eq('user_id', userId);

    if (votesError) {
      console.error("Error fetching votes:", votesError);
    }

    // Get user's comments count
    const { count: commentsCount, error: commentsError } = await supabase
      .from('idea_comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    // Get user's bookmarks count
    const { count: bookmarksCount, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError);
    }

    // Calculate stats
    const ideasList = ideas || [];
    const votesList = votes || [];

    const stats = {
      total_ideas: ideasList.length,
      published_ideas: ideasList.filter(i => i.status === 'published').length,
      draft_ideas: ideasList.filter(i => i.status === 'draft').length,
      total_upvotes_received: ideasList.reduce((sum, i) => sum + (i.upvotes || 0), 0),
      total_comments_received: ideasList.reduce((sum, i) => sum + (i.comments_count || 0), 0),
      ideas_upvoted: votesList.filter(v => v.vote_type === 'up').length,
      ideas_downvoted: votesList.filter(v => v.vote_type === 'down').length,
      ideas_commented: commentsCount || 0,
      ideas_bookmarked: bookmarksCount || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in dashboard stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
