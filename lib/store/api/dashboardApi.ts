import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Idea, DashboardStats } from "@/lib/types"

interface DashboardIdeasResponse {
  ideas: Idea[]
  totalPages: number
  currentPage: number
  totalIdeas: number
}

interface ActivityResponse {
  ideas: Idea[]
  totalPages: number
  currentPage: number
}

interface BookmarksResponse {
  bookmarks: Array<{
    id: number
    idea_id: string
    created_at: string
    idea: Idea
  }>
  totalPages: number
  currentPage: number
}

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/dashboard" }),
  tagTypes: ["DashboardStats", "DashboardIdeas", "Activity", "Bookmarks"],
  endpoints: (builder) => ({
    // Get dashboard stats
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => "stats",
      providesTags: ["DashboardStats"],
    }),

    // Get user's ideas
    getUserIdeas: builder.query<DashboardIdeasResponse, { page?: number; status?: string }>({
      query: ({ page = 1, status = "all" }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        })
        if (status !== "all") params.append("status", status)
        return `ideas?${params.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.ideas.map(({ id }) => ({ type: "DashboardIdeas" as const, id })),
              { type: "DashboardIdeas", id: "LIST" },
            ]
          : [{ type: "DashboardIdeas", id: "LIST" }],
    }),

    // Get user activity (upvoted, downvoted, commented)
    getActivity: builder.query<ActivityResponse, { type: "upvoted" | "downvoted" | "commented"; page?: number }>({
      query: ({ type, page = 1 }) => `activity?type=${type}&page=${page}`,
      providesTags: (result, error, { type }) => [{ type: "Activity", id: type }],
    }),

    // Get user bookmarks
    getBookmarks: builder.query<BookmarksResponse, { page?: number }>({
      query: ({ page = 1 }) => `bookmarks?page=${page}`,
      providesTags: ["Bookmarks"],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetUserIdeasQuery,
  useGetActivityQuery,
  useGetBookmarksQuery,
} = dashboardApi
