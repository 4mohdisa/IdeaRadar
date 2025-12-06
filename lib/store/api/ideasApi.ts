import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { Idea } from "@/lib/types"

interface IdeasResponse {
  ideas: Idea[]
  totalPages: number
  currentPage: number
  totalIdeas: number
}

interface IdeasQueryParams {
  page?: number
  limit?: number
  sort?: string
  search?: string
  minScore?: number
}

interface VoteResponse {
  success: boolean
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
}

interface BookmarkResponse {
  success: boolean
  isBookmarked: boolean
}

interface CreateIdeaInput {
  title: string
  description: string
  body_text?: string
  status?: "draft" | "published"
}

interface SearchResult {
  id: string
  title: string
  description: string
  source: string
  market_potential_score: number
  relevanceScore: number
}

interface SearchResponse {
  results: SearchResult[]
  query: string
  totalResults: number
}

interface LeaderboardIdea {
  id: string
  title: string
  description: string
  source: string
  subreddit?: string
  market_potential_score: number
  upvotes: number
  downvotes: number
  comments_count: number
  rank: number
  net_score: number
}

interface LeaderboardResponse {
  ideas: LeaderboardIdea[]
  type: string
  period: string
}

interface LeaderboardParams {
  type?: "overall" | "reddit" | "community"
  period?: "today" | "week" | "month" | "all"
}

interface Comment {
  id: number
  idea_id: string
  user_id: string
  content: string
  parent_id: number | null
  created_at: string
  updated_at: string
  username: string | null
  first_name: string | null
  last_name: string | null
  image_url: string | null
}

interface CommentsResponse {
  comments: Comment[]
}

export const ideasApi = createApi({
  reducerPath: "ideasApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Ideas", "Idea", "Vote", "Bookmark", "TopIdeas", "Comments"],
  endpoints: (builder) => ({
    // Get paginated ideas list
    getIdeas: builder.query<IdeasResponse, IdeasQueryParams>({
      query: ({ page = 1, limit = 12, sort = "recent", search = "", minScore = 0 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort,
        })
        if (search) params.append("search", search)
        if (minScore > 0) params.append("minScore", minScore.toString())
        return `ideas?${params.toString()}`
      },
      providesTags: (result) =>
        result
          ? [
              ...result.ideas.map(({ id }) => ({ type: "Ideas" as const, id })),
              { type: "Ideas", id: "LIST" },
            ]
          : [{ type: "Ideas", id: "LIST" }],
    }),

    // Get top ideas for carousel
    getTopIdeas: builder.query<IdeasResponse, void>({
      query: () => "ideas?sort=score&limit=5",
      providesTags: [{ type: "TopIdeas", id: "LIST" }],
    }),

    // Get single idea by ID
    getIdeaById: builder.query<Idea, string>({
      query: (id) => `ideas/${id}`,
      providesTags: (result, error, id) => [{ type: "Idea", id }],
    }),

    // Create new idea
    createIdea: builder.mutation<Idea, CreateIdeaInput>({
      query: (body) => ({
        url: "ideas",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Ideas", id: "LIST" },
        { type: "TopIdeas", id: "LIST" },
      ],
    }),

    // Delete idea
    deleteIdea: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `ideas/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Ideas", id: "LIST" },
        { type: "Idea", id },
        { type: "TopIdeas", id: "LIST" },
      ],
    }),

    // Update idea
    updateIdea: builder.mutation<Idea, { id: string; data: Partial<CreateIdeaInput> }>({
      query: ({ id, data }) => ({
        url: `ideas/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Ideas", id: "LIST" },
        { type: "Idea", id },
        { type: "TopIdeas", id: "LIST" },
      ],
    }),

    // Get user's vote for an idea
    getUserVote: builder.query<{ vote: "up" | "down" | null }, string>({
      query: (ideaId) => `ideas/${ideaId}/vote`,
      providesTags: (result, error, ideaId) => [{ type: "Vote", id: ideaId }],
    }),

    // Cast vote on idea
    castVote: builder.mutation<VoteResponse, { ideaId: string; voteType: "up" | "down" }>({
      query: ({ ideaId, voteType }) => ({
        url: `ideas/${ideaId}/vote`,
        method: "POST",
        body: { vote_type: voteType },
      }),
      invalidatesTags: (result, error, { ideaId }) => [
        { type: "Vote", id: ideaId },
        { type: "Idea", id: ideaId },
        { type: "Ideas", id: "LIST" },
      ],
    }),

    // Remove vote from idea
    removeVote: builder.mutation<VoteResponse, string>({
      query: (ideaId) => ({
        url: `ideas/${ideaId}/vote`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, ideaId) => [
        { type: "Vote", id: ideaId },
        { type: "Idea", id: ideaId },
        { type: "Ideas", id: "LIST" },
      ],
    }),

    // Get bookmark status
    getBookmarkStatus: builder.query<{ isBookmarked: boolean }, string>({
      query: (ideaId) => `ideas/${ideaId}/bookmark`,
      providesTags: (result, error, ideaId) => [{ type: "Bookmark", id: ideaId }],
    }),

    // Toggle bookmark
    toggleBookmark: builder.mutation<BookmarkResponse, { ideaId: string; isBookmarked: boolean }>({
      query: ({ ideaId, isBookmarked }) => ({
        url: `ideas/${ideaId}/bookmark`,
        method: isBookmarked ? "DELETE" : "POST",
      }),
      invalidatesTags: (result, error, { ideaId }) => [{ type: "Bookmark", id: ideaId }],
    }),

    // Search ideas
    searchIdeas: builder.query<SearchResponse, { query: string; minScore?: number }>({
      query: ({ query, minScore = 0 }) => {
        const params = new URLSearchParams({ q: query })
        if (minScore > 0) params.append("minScore", minScore.toString())
        return `search?${params.toString()}`
      },
    }),

    // Get leaderboard
    getLeaderboard: builder.query<LeaderboardResponse, LeaderboardParams>({
      query: ({ type = "overall", period = "week" }) => 
        `leaderboard?type=${type}&period=${period}`,
      providesTags: ["Ideas"],
    }),

    // Get comments for an idea
    getComments: builder.query<CommentsResponse, string>({
      query: (ideaId) => `ideas/${ideaId}/comments`,
      providesTags: (result, error, ideaId) => [{ type: "Comments", id: ideaId }],
    }),

    // Post a new comment
    postComment: builder.mutation<Comment, { ideaId: string; content: string; parentId?: number }>({
      query: ({ ideaId, content, parentId }) => ({
        url: `ideas/${ideaId}/comments`,
        method: "POST",
        body: { content, parent_id: parentId },
      }),
      invalidatesTags: (result, error, { ideaId }) => [
        { type: "Comments", id: ideaId },
        { type: "Idea", id: ideaId },
      ],
    }),
  }),
})

export const {
  useGetIdeasQuery,
  useGetTopIdeasQuery,
  useGetIdeaByIdQuery,
  useCreateIdeaMutation,
  useDeleteIdeaMutation,
  useUpdateIdeaMutation,
  useGetUserVoteQuery,
  useCastVoteMutation,
  useRemoveVoteMutation,
  useGetBookmarkStatusQuery,
  useToggleBookmarkMutation,
  useSearchIdeasQuery,
  useGetLeaderboardQuery,
  useGetCommentsQuery,
  usePostCommentMutation,
} = ideasApi
