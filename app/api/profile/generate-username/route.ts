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
  userId: string
): string {
  // Try to create username from first name + last name
  if (firstName && lastName) {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 3) {
      return `${base}${userId.slice(-4)}`
    }
  }
  
  // Try first name only
  if (firstName) {
    const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base.length >= 2) {
      return `${base}${userId.slice(-4)}`
    }
  }
  
  // Fall back to email prefix
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (emailPrefix.length >= 2) {
    return `${emailPrefix}${userId.slice(-4)}`
  }
  
  // Last resort: use part of userId
  return `user${userId.slice(-8)}`
}

// POST - Generate username for current user if they don't have one
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // If username already exists, return it
    if (profile.username) {
      return NextResponse.json({ username: profile.username, generated: false })
    }

    // Generate new username
    const newUsername = generateUsername(
      profile.first_name,
      profile.last_name,
      profile.email,
      userId
    )

    // Update profile with new username
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
    }

    return NextResponse.json({ username: newUsername, generated: true })
  } catch (error) {
    console.error("Error generating username:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
