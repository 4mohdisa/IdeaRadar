import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Generate a unique username from name/email
function generateUsername(
  firstName: string | null,
  lastName: string | null,
  email: string,
  oderId: string
): string {
  // Try to create username from first name + last name
  if (firstName && lastName) {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 3) {
      return `${base}${oderId.slice(-4)}`
    }
  }
  
  // Try first name only
  if (firstName) {
    const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 2) {
      return `${base}${oderId.slice(-4)}`
    }
  }
  
  // Fall back to email prefix
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (emailPrefix.length >= 2) {
    return `${emailPrefix}${oderId.slice(-4)}`
  }
  
  // Last resort: use part of userId
  return `user${oderId.slice(-8)}`
}

// POST - Migrate all users without usernames (admin only, one-time use)
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all profiles without usernames
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .is("username", null)

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: "No profiles need migration", updated: 0 })
    }

    let updated = 0
    const results: Array<{ id: string; username: string }> = []

    for (const profile of profiles) {
      const newUsername = generateUsername(
        profile.first_name,
        profile.last_name,
        profile.email,
        profile.id
      )

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", profile.id)

      if (!updateError) {
        updated++
        results.push({ id: profile.id, username: newUsername })
      }
    }

    return NextResponse.json({ 
      message: `Migration complete`, 
      updated,
      total: profiles.length,
      results 
    })
  } catch (error) {
    console.error("Error migrating usernames:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
