"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_ideas: 0,
    published_ideas: 0,
    draft_ideas: 0,
    total_upvotes_received: 0,
    total_comments_received: 0,
    ideas_upvoted: 0,
    ideas_downvoted: 0,
    ideas_commented: 0,
    ideas_bookmarked: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({
    title,
    value,
    icon,
    color = "accent",
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        <div className={`text-${color}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-text-main">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="container py-8">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-border"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-main">Dashboard</h1>
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Idea
        </Link>
      </div>

      {/* Quick Navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/dashboard/ideas"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
        >
          My Ideas
        </Link>
        <Link
          href="/dashboard/bookmarks"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
        >
          Bookmarks
        </Link>
        <Link
          href="/dashboard/activity"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
        >
          Activity
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-text-main">Your Ideas</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Ideas"
            value={stats.total_ideas}
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <StatCard
            title="Published"
            value={stats.published_ideas}
            color="green-400"
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <StatCard
            title="Drafts"
            value={stats.draft_ideas}
            color="yellow-400"
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            }
          />
          <StatCard
            title="Total Upvotes"
            value={stats.total_upvotes_received}
            color="green-400"
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Activity Stats */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-text-main">Your Activity</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ideas Upvoted"
            value={stats.ideas_upvoted}
            color="green-400"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            }
          />
          <StatCard
            title="Ideas Downvoted"
            value={stats.ideas_downvoted}
            color="red-400"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            }
          />
          <StatCard
            title="Comments Made"
            value={stats.ideas_commented}
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <StatCard
            title="Bookmarked Ideas"
            value={stats.ideas_bookmarked}
            icon={
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

