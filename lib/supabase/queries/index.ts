/**
 * Database Queries Module
 * 
 * Central export point for all database query functions
 */

// Ideas queries
export {
  getIdeas,
  getIdeaById,
  getIdeasByUserId,
  getLeaderboardIdeas,
  generateUserIdeaId,
  createIdea,
  updateIdea,
  deleteIdea,
  type GetIdeasOptions,
  type CreateIdeaInput,
  type UpdateIdeaInput,
} from './ideas'

// Votes queries
export {
  getUserVote,
  getIdeaVotes,
  getVoteCounts,
  castVote,
  removeVote,
  getUserVotedIdeas,
  type VoteType,
} from './votes'

// Comments queries
export {
  getIdeaComments,
  getCommentById,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  getUserCommentedIdeas,
  getCommentCount,
  type CreateCommentInput,
} from './comments'

// Bookmarks queries
export {
  isIdeaBookmarked,
  getUserBookmarks,
  getBookmarkCount,
  addBookmark,
  removeBookmark,
  toggleBookmark,
} from './bookmarks'

// Profiles queries
export {
  getProfileById,
  getProfileByEmail,
  upsertProfile,
  updateProfile,
  deleteProfile,
  getUserActivitySummary,
  profileExists,
  type UpsertProfileInput,
} from './profiles'
