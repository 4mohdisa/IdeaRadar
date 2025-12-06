"use client";

import Link from "next/link";
import { IdeaCard } from "@/components/ui/idea-card";
import { useGetBookmarksQuery } from "@/lib/store";

export default function BookmarksPage() {
  const { data, isLoading: loading } = useGetBookmarksQuery({ page: 1 });
  
  const ideas = data?.bookmarks?.map(b => b.idea) || [];

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-text-main">Bookmarked Ideas</h1>
        <p className="mt-2 text-text-muted">Ideas you&apos;ve saved for later</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-text-muted"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <h3 className="mb-2 text-xl font-semibold text-text-main">No bookmarks yet</h3>
          <p className="mb-6 text-text-muted">
            Start bookmarking ideas you find interesting!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Browse Ideas
          </Link>
        </div>
      )}

      {/* Ideas Grid */}
      {!loading && ideas.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} userVote={null} isBookmarked={true} />
          ))}
        </div>
      )}
    </div>
  );
}

