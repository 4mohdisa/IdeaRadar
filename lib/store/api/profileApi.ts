import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Idea } from "@/lib/types"

interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  joinedAt: string
}

interface UserAnalytics {
  totalIdeas: number
  totalUpvotes: number
  totalDownvotes: number
  totalComments: number
  avgScore: number
  topScore: number
  medianScore: number
  publishedIdeas: number
}

interface ProfileResponse {
  profile: UserProfile
  analytics: UserAnalytics
  ideas: Idea[]
}

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/profile" }),
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    // Get user profile by username
    getProfileByUsername: builder.query<ProfileResponse, string>({
      query: (username) => username,
      providesTags: (result, error, username) => [{ type: "Profile", id: username }],
    }),

    // Generate username for current user (if missing)
    generateUsername: builder.mutation<{ username: string; generated: boolean }, void>({
      query: () => ({
        url: "generate-username",
        method: "POST",
      }),
    }),
  }),
})

export const {
  useGetProfileByUsernameQuery,
  useGenerateUsernameMutation,
} = profileApi
