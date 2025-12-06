/**
 * Script to re-evaluate all ideas with the new scoring algorithm
 * 
 * Run with: npx tsx --env-file=.env.local scripts/re-evaluate-ideas.ts
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey = process.env.GEMINI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

if (!geminiApiKey) {
  console.error("Missing GEMINI_API_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Retry wrapper for API calls
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      console.log(`    ⏳ Retry ${i + 1}/${retries} after error...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error("Max retries exceeded")
}

// Import the scoring function dynamically to ensure env vars are loaded
async function analyzeIdea(
  title: string,
  description: string,
  bodyText?: string | null,
  context?: { source?: "reddit" | "community" }
) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  
  const genAI = new GoogleGenerativeAI(geminiApiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite", // More reliable for structured output
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 800,
    },
  })

  // Truncate content to avoid token limits
  const maxContentLength = 1000
  let fullContent = description.substring(0, maxContentLength)
  
  const prompt = `Score this startup idea from 0-100 and write a brief summary.

Title: ${title}
Description: ${fullContent}

Respond with ONLY this JSON format (no other text):
{"total_score": 75, "ai_summary": "Brief 2 sentence summary of the idea and its potential."}`

  return withRetry(async () => {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to fix common JSON issues
    let jsonToParse = cleanedResponse
    
    // If JSON is truncated, try to close it
    if (!jsonToParse.endsWith('}')) {
      // Find last complete property and close
      const lastQuote = jsonToParse.lastIndexOf('"')
      if (lastQuote > 0) {
        jsonToParse = jsonToParse.substring(0, lastQuote + 1) + '}'
        // Close score_breakdown if needed
        if (jsonToParse.includes('"score_breakdown"') && !jsonToParse.includes('},"total_score"')) {
          jsonToParse = jsonToParse.replace(/}$/, '},"total_score":50,"ai_summary":"Analysis in progress."}')
        }
      }
    }

    const analysis = JSON.parse(jsonToParse)

    return {
      market_potential_score: Math.min(100, Math.max(0, analysis.total_score ?? 50)),
      ai_summary: analysis.ai_summary || description,
      score_breakdown: analysis.score_breakdown,
    }
  })
}

async function reEvaluateAllIdeas(onlyScore50 = false) {
  console.log("🚀 Starting re-evaluation of ideas...\n")

  // Fetch ideas
  let query = supabase
    .from("ideas")
    .select("id, title, description, body_text, source, market_potential_score")
    .order("created_at", { ascending: false })
  
  // Optionally filter to only ideas with score 50 (default/failed)
  if (onlyScore50) {
    query = query.eq("market_potential_score", 50)
    console.log("📌 Filtering to only ideas with score = 50\n")
  }

  const { data: ideas, error } = await query

  if (error) {
    console.error("Failed to fetch ideas:", error)
    process.exit(1)
  }

  console.log(`📊 Found ${ideas.length} ideas to re-evaluate\n`)

  let successCount = 0
  let errorCount = 0
  const startTime = Date.now()

  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i]
    const progress = `[${i + 1}/${ideas.length}]`

    try {
      console.log(`${progress} Analyzing: "${idea.title.substring(0, 50)}..."`)
      
      const analysis = await analyzeIdea(
        idea.title,
        idea.description,
        idea.body_text,
        { source: idea.source === "reddit" ? "reddit" : "community" }
      )

      // Update the idea in database
      const { error: updateError } = await supabase
        .from("ideas")
        .update({
          market_potential_score: analysis.market_potential_score,
          description: analysis.ai_summary,
          updated_at: new Date().toISOString(),
        })
        .eq("id", idea.id)

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`)
        errorCount++
      } else {
        const scoreDiff = analysis.market_potential_score - (idea.market_potential_score || 0)
        const diffStr = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`
        console.log(`  ✅ Score: ${idea.market_potential_score || 0} → ${analysis.market_potential_score} (${diffStr})`)
        successCount++
      }

      // Rate limiting: wait 1 second between requests to respect API limits
      if (i < ideas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error(`  ❌ Error analyzing idea: ${err}`)
      errorCount++
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log("\n" + "=".repeat(50))
  console.log("📈 Re-evaluation Complete!")
  console.log("=".repeat(50))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏱️  Duration: ${duration}s`)
  console.log("=".repeat(50))
}

// Run the script - pass true to only re-evaluate ideas with score 50
const onlyFailedIdeas = process.argv.includes("--failed-only")
reEvaluateAllIdeas(onlyFailedIdeas).catch(console.error)
