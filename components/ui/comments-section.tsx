"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useGetCommentsQuery, usePostCommentMutation } from "@/lib/store";

interface Comment {
  id: number;
  idea_id: string;
  user_id: string;
  content: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface CommentsSectionProps {
  ideaId: string;
  ideaAuthorId?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function getDisplayName(comment: Comment): string {
  if (comment.first_name || comment.last_name) {
    return `${comment.first_name || ''} ${comment.last_name || ''}`.trim();
  }
  return comment.username || 'Anonymous';
}

function getInitial(comment: Comment): string {
  const name = getDisplayName(comment);
  return name[0]?.toUpperCase() || '?';
}

function CommentItem({ 
  comment, 
  ideaAuthorId,
  replies,
  onReply,
  depth = 0 
}: { 
  comment: Comment; 
  ideaAuthorId?: string;
  replies: Comment[];
  onReply: (parentId: number, content: string) => Promise<void>;
  depth?: number;
}) {
  const { isSignedIn } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isAuthor = ideaAuthorId === comment.user_id;
  const childReplies = replies.filter(r => r.parent_id === comment.id);

  const handleReply = async () => {
    if (!replyText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const marginLeft = depth > 0 ? `${Math.min(depth, 4) * 1.5}rem` : "0";

  return (
    <div style={{ marginLeft }} className={depth > 0 ? "border-l-2 border-border pl-4" : ""}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="mb-2 flex items-center gap-2">
          {comment.image_url ? (
            <img 
              src={comment.image_url} 
              alt={getDisplayName(comment)}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-medium text-accent">
              {getInitial(comment)}
            </div>
          )}
          <div className="flex flex-1 items-center gap-2 text-sm">
            <span className="font-medium text-text-main">{getDisplayName(comment)}</span>
            {isAuthor && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                Author
              </span>
            )}
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">{formatDate(comment.created_at)}</span>
          </div>
        </div>

        {/* Comment Content */}
        <p className="mb-2 text-sm leading-relaxed text-text-main whitespace-pre-wrap">{comment.content}</p>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-xs">
          {isSignedIn && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-text-muted transition-colors hover:text-accent"
            >
              Reply
            </button>
          )}

          {childReplies.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-muted transition-colors hover:text-accent"
            >
              {isExpanded ? "Collapse" : `Show ${childReplies.length} ${childReplies.length === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              rows={3}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || isSubmitting}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Reply"}
              </button>
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText("");
                }}
                className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {isExpanded && childReplies.length > 0 && (
        <div>
          {childReplies.map((reply) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              ideaAuthorId={ideaAuthorId}
              replies={replies}
              onReply={onReply}
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ ideaId, ideaAuthorId }: CommentsSectionProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [commentText, setCommentText] = useState("");

  // RTK Query hooks - comments are now cached
  const { data, isLoading } = useGetCommentsQuery(ideaId);
  const [postComment, { isLoading: isSubmitting }] = usePostCommentMutation();
  
  const comments = data?.comments || [];

  // Post a new comment
  const handleSubmit = async () => {
    if (!commentText.trim() || !isSignedIn || isSubmitting) return;

    try {
      await postComment({ ideaId, content: commentText.trim() }).unwrap();
      setCommentText('');
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  // Post a reply
  const handleReply = async (parentId: number, content: string) => {
    try {
      await postComment({ ideaId, content, parentId }).unwrap();
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter(c => c.parent_id === null);

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="mb-6 text-xl font-semibold text-text-main">
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      {isSignedIn ? (
        <div className="mb-8">
          <div className="flex gap-3">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Your avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-medium text-accent">
                {user?.firstName?.[0] || '?'}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts on this idea..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-main placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                rows={3}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                  className="rounded-lg bg-accent px-6 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-lg border border-border bg-background p-4 text-center">
          <p className="text-text-muted">Sign in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-text-muted">Loading comments...</p>
        </div>
      ) : (
        <div className="space-y-0">
          {topLevelComments.length > 0 ? (
            topLevelComments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                ideaAuthorId={ideaAuthorId}
                replies={comments}
                onReply={handleReply}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-text-muted">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
