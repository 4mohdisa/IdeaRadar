// Store exports
export { makeStore } from "./store"
export type { AppStore, RootState, AppDispatch } from "./store"

// Hooks exports
export { useAppDispatch, useAppSelector, useAppStore } from "./hooks"

// API exports - Ideas
export {
  ideasApi,
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
} from "./api/ideasApi"

// API exports - Dashboard
export {
  dashboardApi,
  useGetDashboardStatsQuery,
  useGetUserIdeasQuery,
  useGetActivityQuery,
  useGetBookmarksQuery,
} from "./api/dashboardApi"

// API exports - Profile
export {
  profileApi,
  useGetProfileByUsernameQuery,
  useGenerateUsernameMutation,
} from "./api/profileApi"
