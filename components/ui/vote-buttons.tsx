"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface VoteButtonsProps {
  ideaId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: "up" | "down" | null;
  layout?: "horizontal" | "vertical";
  showCount?: boolean;
}

export function VoteButtons({
  ideaId,
  initialUpvotes,
  initialDownvotes,
  userVote: initialUserVote = null,
  layout = "horizontal",
  showCount = true,
}: VoteButtonsProps) {
  const { isSignedIn } = useAuth();
  const [userVote, setUserVote] = useState<"up" | "down" | null>(initialUserVote);
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [isLoading, setIsLoading] = useState(false);

  const netScore = upvotes - downvotes;

  const handleVote = useCallback(async (voteType: "up" | "down") => {
    if (!isSignedIn) {
      // Could show a sign-in modal here
      alert("Please sign in to vote");
      return;
    }

    if (isLoading) return;

    // Store previous state for rollback
    const previousVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    // Optimistic update
    if (userVote === voteType) {
      // Remove vote
      setUserVote(null);
      if (voteType === "up") {
        setUpvotes(upvotes - 1);
      } else {
        setDownvotes(downvotes - 1);
      }
    } else if (userVote === null) {
      // Add new vote
      setUserVote(voteType);
      if (voteType === "up") {
        setUpvotes(upvotes + 1);
      } else {
        setDownvotes(downvotes + 1);
      }
    } else {
      // Change vote
      setUserVote(voteType);
      if (voteType === "up") {
        setUpvotes(upvotes + 1);
        setDownvotes(downvotes - 1);
      } else {
        setDownvotes(downvotes + 1);
        setUpvotes(upvotes - 1);
      }
    }

    // Make API call
    try {
      setIsLoading(true);
      
      const isRemovingVote = previousVote === voteType;
      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: isRemovingVote ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isRemovingVote ? undefined : JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes("not in the database")) {
          alert("This idea cannot be voted on because it's from sample data. Only ideas created on the platform can be voted on.");
        }
        throw new Error(data.error || 'Vote failed');
      }
    } catch (error) {
      // Revert on error
      console.error("Vote error:", error);
      setUserVote(previousVote);
      setUpvotes(previousUpvotes);
      setDownvotes(previousDownvotes);
    } finally {
      setIsLoading(false);
    }
  }, [ideaId, isSignedIn, isLoading, userVote, upvotes, downvotes]);

  const containerClass =
    layout === "vertical"
      ? "flex flex-col items-center gap-1"
      : "flex items-center gap-2";

  return (
    <div className={containerClass}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote("up")}
        className={`group flex items-center gap-1 rounded-lg p-2 transition-all duration-200 active:scale-95 ${
          userVote === "up"
            ? "bg-green-500/20 text-green-400 animate-success-pulse"
            : "text-text-muted hover:bg-surface hover:text-green-400"
        }`}
        aria-label="Upvote"
      >
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${userVote === "up" ? "scale-110" : "group-hover:scale-110"}`}
          fill={userVote === "up" ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
        {showCount && layout === "horizontal" && (
          <span className="text-sm font-medium transition-all duration-200">{upvotes}</span>
        )}
      </button>

      {/* Score Display (for vertical layout) */}
      {layout === "vertical" && showCount && (
        <span
          className={`text-sm font-bold transition-all duration-300 ${
            netScore > 0
              ? "text-green-400"
              : netScore < 0
              ? "text-red-400"
              : "text-text-muted"
          }`}
        >
          {netScore > 0 ? "+" : ""}
          {netScore}
        </span>
      )}

      {/* Downvote Button */}
      <button
        onClick={() => handleVote("down")}
        className={`group flex items-center gap-1 rounded-lg p-2 transition-all duration-200 active:scale-95 ${
          userVote === "down"
            ? "bg-red-500/20 text-red-400"
            : "text-text-muted hover:bg-surface hover:text-red-400"
        }`}
        aria-label="Downvote"
      >
        <svg
          className={`h-5 w-5 transition-transform duration-200 ${userVote === "down" ? "scale-110" : "group-hover:scale-110"}`}
          fill={userVote === "down" ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        {showCount && layout === "horizontal" && (
          <span className="text-sm font-medium transition-all duration-200">{downvotes}</span>
        )}
      </button>

      {/* Net Score (for horizontal layout) */}
      {layout === "horizontal" && showCount && (
        <span
          className={`text-sm font-bold transition-all duration-300 ${
            netScore > 0
              ? "text-green-400"
              : netScore < 0
              ? "text-red-400"
              : "text-text-muted"
          }`}
        >
          {netScore > 0 ? "+" : ""}
          {netScore}
        </span>
      )}
    </div>
  );
}

