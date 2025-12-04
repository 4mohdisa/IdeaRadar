"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface BookmarkButtonProps {
  ideaId: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BookmarkButton({
  ideaId,
  initialBookmarked = false,
  showLabel = false,
  size = "md",
}: BookmarkButtonProps) {
  const { isSignedIn } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!isSignedIn) {
      alert("Please sign in to bookmark ideas");
      return;
    }

    if (isLoading) return;

    const previousState = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      setIsLoading(true);
      const response = await fetch(`/api/ideas/${ideaId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes("not in the database")) {
          alert("This idea cannot be bookmarked because it's from sample data. Only ideas created on the platform can be bookmarked.");
        }
        throw new Error(data.error || 'Bookmark failed');
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      setIsBookmarked(previousState);
    } finally {
      setIsLoading(false);
    }
  }, [ideaId, isSignedIn, isLoading, isBookmarked]);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const paddingClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  return (
    <button
      onClick={handleToggle}
      className={`group flex items-center gap-2 rounded-lg ${paddingClasses[size]} transition-all duration-200 active:scale-95 ${
        isBookmarked
          ? "bg-accent/20 text-accent animate-success-pulse"
          : "text-text-muted hover:bg-surface hover:text-accent"
      }`}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <svg
        className={`${sizeClasses[size]} transition-transform duration-200 ${isBookmarked ? "scale-110" : "group-hover:scale-110"}`}
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium transition-all duration-200">
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </span>
      )}
    </button>
  );
}

