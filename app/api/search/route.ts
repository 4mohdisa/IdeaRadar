import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SearchResult {
  id: string
  title: string
  description: string
  source: string
  market_potential_score: number
  relevanceScore: number
}

/**
 * Advanced search endpoint that searches the database
 * Supports multi-term search with relevance scoring
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "20")
    const minScore = parseInt(searchParams.get("minScore") || "0")

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1)
    
    if (searchTerms.length === 0) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const results: SearchResult[] = []

    // Search database for ideas
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Build search query for Supabase
    // Using ilike for case-insensitive search
    let dbQuery = supabase
      .from("ideas")
      .select("id, title, description, body_text, source, market_potential_score, status")
      .eq("status", "published")

    if (minScore > 0) {
      dbQuery = dbQuery.gte("market_potential_score", minScore)
    }

    // Search using OR conditions for each term
    const searchConditions = searchTerms.map(term => 
      `title.ilike.%${term}%,description.ilike.%${term}%`
    ).join(",")
    
    dbQuery = dbQuery.or(searchConditions)

    const { data: dbIdeas, error } = await dbQuery.limit(100)

    if (error) {
      console.error("Database search error:", error)
    } else if (dbIdeas) {
      for (const idea of dbIdeas) {
        const relevanceScore = calculateRelevance(
          searchTerms,
          idea.title,
          idea.description,
          idea.body_text
        )

        if (relevanceScore > 0) {
          results.push({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            source: idea.source,
            market_potential_score: idea.market_potential_score ?? 50,
            relevanceScore,
          })
        }
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Apply limit
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      query,
      terms: searchTerms,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}

/**
 * Calculate relevance score for a search result
 */
function calculateRelevance(
  searchTerms: string[],
  title: string,
  description: string,
  bodyText?: string | null
): number {
  let score = 0
  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  const bodyLower = (bodyText || "").toLowerCase()

  for (const term of searchTerms) {
    // Title matches (highest weight)
    if (titleLower === term) {
      score += 100 // Exact match
    } else if (titleLower.startsWith(term)) {
      score += 50 // Starts with
    } else if (titleLower.includes(term)) {
      score += 30 // Contains
    }

    // Word boundary match in title
    if (new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(title)) {
      score += 25
    }

    // Description matches
    if (descLower.includes(term)) {
      score += 15
    }

    // Word boundary match in description
    if (new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(description)) {
      score += 10
    }

    // Body text matches (lowest weight)
    if (bodyLower.includes(term)) {
      score += 5
    }
  }

  // Bonus for matching all terms
  const matchedTerms = searchTerms.filter(
    term => titleLower.includes(term) || descLower.includes(term) || bodyLower.includes(term)
  )
  
  if (matchedTerms.length === searchTerms.length && searchTerms.length > 1) {
    score *= 1.5
  }

  // Bonus for consecutive term matches (phrase matching)
  const fullQuery = searchTerms.join(" ")
  if (titleLower.includes(fullQuery)) {
    score += 50
  }
  if (descLower.includes(fullQuery)) {
    score += 25
  }

  return Math.round(score)
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
