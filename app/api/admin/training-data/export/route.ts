/**
 * Admin API: Export Training Data as JSONL
 */

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { exportTrainingDataAsJSONL } from "@/lib/openai/training"

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []

async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const jsonl = await exportTrainingDataAsJSONL({
      excludeAlreadyTrained: false, // Export all validated data
    })

    return new NextResponse(jsonl, {
      headers: {
        "Content-Type": "application/jsonl",
        "Content-Disposition": `attachment; filename="training_data_${new Date().toISOString().split("T")[0]}.jsonl"`,
      },
    })
  } catch (error) {
    console.error("Error exporting training data:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
