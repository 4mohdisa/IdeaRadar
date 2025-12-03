import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClerkSupabaseClient, ensureUserProfile } from "@/lib/supabase";
import { createIdea } from "@/lib/supabase/queries/ideas";
import { analyzeIdea } from "@/lib/ai/gemini";
import type { Idea } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sort = searchParams.get("sort") || "popular";
  const search = searchParams.get("search") || "";
  const minScore = parseInt(searchParams.get("minScore") || "0");

  // Fetch ideas from database only
  let allIdeas: Idea[] = [];

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: dbIdeas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching ideas from database:", error);
      return NextResponse.json({ 
        ideas: [], 
        totalPages: 0, 
        currentPage: page, 
        totalIdeas: 0 
      });
    }
    
    if (dbIdeas && dbIdeas.length > 0) {
      // Transform database ideas to match the Idea type
      allIdeas = dbIdeas.map(idea => ({
        id: idea.id,
        title: idea.title,
        original_title: idea.original_title,
        description: idea.description,
        body_text: idea.body_text || '',
        source: idea.source as 'reddit' | 'user',
        user_id: idea.user_id,
        subreddit: idea.subreddit || undefined,
        author: idea.reddit_author || 'User',
        reddit_author: idea.reddit_author,
        upvotes: idea.upvotes || 0,
        downvotes: idea.downvotes || 0,
        comments_count: idea.comments_count || 0,
        created_at: idea.created_at,
        post_url: idea.post_url,
        thumbnail: idea.thumbnail,
        market_potential_score: idea.market_potential_score ?? 50,
        status: idea.status,
      }));
    }
  } catch (error) {
    console.error("Error fetching from database:", error);
    return NextResponse.json({ 
      ideas: [], 
      totalPages: 0, 
      currentPage: page, 
      totalIdeas: 0 
    });
  }

  // Filter ideas
  let filteredIdeas = allIdeas;

  // Advanced search filter with relevance scoring
  if (search) {
    const searchTerms = search.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    // Score each idea based on search relevance
    const scoredIdeas = filteredIdeas.map(idea => {
      let relevanceScore = 0;
      const titleLower = idea.title.toLowerCase();
      const descLower = idea.description.toLowerCase();
      const bodyLower = (idea.body_text || '').toLowerCase();
      
      for (const term of searchTerms) {
        // Exact title match (highest priority)
        if (titleLower === term) relevanceScore += 100;
        // Title starts with term
        else if (titleLower.startsWith(term)) relevanceScore += 50;
        // Title contains term
        else if (titleLower.includes(term)) relevanceScore += 30;
        
        // Description contains term
        if (descLower.includes(term)) relevanceScore += 15;
        
        // Body text contains term
        if (bodyLower.includes(term)) relevanceScore += 5;
        
        // Word boundary matches (more relevant)
        const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (wordBoundaryRegex.test(idea.title)) relevanceScore += 20;
        if (wordBoundaryRegex.test(idea.description)) relevanceScore += 10;
      }
      
      // Boost for matching multiple terms
      const matchedTerms = searchTerms.filter(term => 
        titleLower.includes(term) || descLower.includes(term) || bodyLower.includes(term)
      );
      if (matchedTerms.length === searchTerms.length && searchTerms.length > 1) {
        relevanceScore *= 1.5; // Boost for matching all terms
      }
      
      return { idea, relevanceScore };
    });
    
    // Filter out ideas with no relevance and sort by relevance
    filteredIdeas = scoredIdeas
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(item => item.idea);
  }

  // Min score filter
  if (minScore > 0) {
    filteredIdeas = filteredIdeas.filter((idea) => idea.market_potential_score >= minScore);
  }

  // Sort
  switch (sort) {
    case "recent":
      filteredIdeas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case "comments":
      filteredIdeas.sort((a, b) => b.comments_count - a.comments_count);
      break;
    case "score":
      filteredIdeas.sort((a, b) => b.market_potential_score - a.market_potential_score);
      break;
    case "popular":
    default:
      filteredIdeas.sort((a, b) => b.upvotes - a.upvotes);
      break;
  }

  // Pagination
  const totalIdeas = filteredIdeas.length;
  const totalPages = Math.ceil(totalIdeas / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedIdeas = filteredIdeas.slice(startIndex, endIndex);

  return NextResponse.json({
    ideas: paginatedIdeas,
    totalPages,
    currentPage: page,
    totalIdeas,
  });
}

// Create a new idea (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Ensure user profile exists (creates if needed)
    const { userId, error: profileError } = await ensureUserProfile()
    
    if (!userId) {
      if (profileError) {
        console.error("Profile error:", profileError)
        return NextResponse.json(
          { error: "Failed to verify user profile" },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, description, body_text, status } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length < 10 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 10 and 200 characters" },
        { status: 400 }
      )
    }

    // Validate description length
    if (description.length < 50 || description.length > 1000) {
      return NextResponse.json(
        { error: "Description must be between 50 and 1000 characters" },
        { status: 400 }
      )
    }

    // Analyze the idea with AI to get score and summary
    const aiAnalysis = await analyzeIdea(title, description, body_text)

    // Get authenticated Supabase client
    const supabase = await createClerkSupabaseClient()

    // Create the idea with AI-generated score and summary
    const { data, error } = await createIdea(supabase, {
      title,
      description: aiAnalysis.ai_summary, // Use AI-generated summary
      body_text: body_text || null,
      user_id: userId,
      status: status || 'published',
      market_potential_score: aiAnalysis.market_potential_score,
      original_description: description, // Store original user description
    })

    if (error) {
      console.error("Error creating idea:", error)
      return NextResponse.json(
        { error: "Failed to create idea" },
        { status: 500 }
      )
    }

    return NextResponse.json({ idea: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/ideas:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
