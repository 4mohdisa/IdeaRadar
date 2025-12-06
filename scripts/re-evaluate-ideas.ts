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
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  })

  const fullContent = bodyText ? `${description}\n\n${bodyText}` : description
  
  let contextInfo = ""
  if (context?.source === "reddit") {
    contextInfo = "\n\nContext: This idea was sourced from Reddit. Consider community validation signals."
  }

  const prompt = `You are an expert startup analyst. Analyze this startup idea comprehensively.

SCORING CRITERIA (each 0-10 points, total 0-100):
- market_demand: Current market demand and problem urgency
- market_timing: Is now the right time? Trends alignment?
- revenue_clarity: Clear path to monetization
- scalability: Growth potential, network effects
- unique_value: Differentiation and innovation
- competitive_moat: Barriers to entry, defensibility
- technical_feasibility: Can it be built with current tech?
- execution_complexity: Resource requirements (10 = easy to execute)
- market_risk: Market adoption confidence (10 = very confident)
- regulatory_risk: Legal/compliance safety (10 = no concerns)

STARTUP IDEA:
Title: ${title}
Description: ${fullContent}${contextInfo}

Return JSON:
{
  "score_breakdown": {
    "market_demand": <0-10>,
    "market_timing": <0-10>,
    "revenue_clarity": <0-10>,
    "scalability": <0-10>,
    "unique_value": <0-10>,
    "competitive_moat": <0-10>,
    "technical_feasibility": <0-10>,
    "execution_complexity": <0-10>,
    "market_risk": <0-10>,
    "regulatory_risk": <0-10>
  },
  "total_score": <0-100>,
  "ai_summary": "<2-3 paragraph professional summary>"
}`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const analysis = JSON.parse(cleanedResponse)

  return {
    market_potential_score: Math.min(100, Math.max(0, analysis.total_score ?? 50)),
    ai_summary: analysis.ai_summary || description,
    score_breakdown: analysis.score_breakdown,
  }
}

async function reEvaluateAllIdeas() {
  console.log("🚀 Starting re-evaluation of all ideas...\n")

  // Fetch all ideas
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, title, description, body_text, source, market_potential_score")
    .order("created_at", { ascending: false })

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

// Run the script
reEvaluateAllIdeas().catch(console.error)
