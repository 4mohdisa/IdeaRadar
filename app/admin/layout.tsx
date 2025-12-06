import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || []

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  // Not logged in - redirect to sign in
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin")
  }

  // Not an admin - redirect to home
  if (!ADMIN_USER_IDS.includes(userId)) {
    redirect("/?error=unauthorized")
  }

  return <>{children}</>
}
