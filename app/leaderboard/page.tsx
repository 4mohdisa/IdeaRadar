"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LeaderboardIdea } from "@/lib/types";
import { SourceBadge } from "@/components/ui/source-badge";
import { ScoreBadge } from "@/components/ui/score-badge";

type LeaderboardType = "overall" | "reddit" | "community";
type TimePeriod = "today" | "week" | "month" | "all";

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("overall");
  const [period, setPeriod] = useState<TimePeriod>("week");
  const [ideas, setIdeas] = useState<LeaderboardIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch leaderboard data
    // const fetchLeaderboard = async () => {
    //   const response = await fetch(`/api/leaderboard?type=${type}&period=${period}`);
    //   const data = await response.json();
    //   setIdeas(data.ideas);
    //   setLoading(false);
    // };
    // fetchLeaderboard();

    // Mock loading
    setTimeout(() => {
      setIdeas([]);
      setLoading(false);
    }, 500);
  }, [type, period]);

  const typeOptions = [
    { value: "overall" as LeaderboardType, label: "🏆 Overall Top" },
    { value: "reddit" as LeaderboardType, label: "🔥 Reddit Ideas" },
    { value: "community" as LeaderboardType, label: "🌟 Community Ideas" },
  ];

  const periodOptions = [
    { value: "today" as TimePeriod, label: "Today" },
    { value: "week" as TimePeriod, label: "This Week" },
    { value: "month" as TimePeriod, label: "This Month" },
    { value: "all" as TimePeriod, label: "All Time" },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-orange-400";
    return "text-text-muted";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-text-main">Leaderboard</h1>
        <p className="text-text-muted">Top ideas ranked by engagement and potential</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Type Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                type === option.value
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-surface hover:bg-border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === option.value
                  ? "bg-accent/20 text-accent"
                  : "border border-border bg-surface hover:bg-border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className="mx-auto max-w-4xl rounded-lg border border-border bg-surface p-12 text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3 className="mb-2 text-xl font-semibold text-text-main">No rankings yet</h3>
          <p className="text-text-muted">Be the first to contribute and climb the leaderboard!</p>
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && ideas.length > 0 && (
        <div className="mx-auto max-w-4xl space-y-3">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/idea/${idea.id}`}
              className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              {/* Rank */}
              <div
                className={`flex w-16 flex-col items-center justify-center text-center ${getRankColor(
                  idea.rank
                )}`}
              >
                <div className="text-2xl">{getRankIcon(idea.rank) || `#${idea.rank}`}</div>
                {idea.rank <= 3 && <div className="text-xs font-medium">Rank</div>}
              </div>

              {/* Idea Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <SourceBadge
                    source={idea.source}
                    subreddit={idea.source === "reddit" ? idea.subreddit : undefined}
                    size="sm"
                  />
                  <ScoreBadge score={idea.market_potential_score} size="sm" />
                </div>
                <h3 className="font-semibold leading-tight text-text-main group-hover:text-accent">
                  {idea.title}
                </h3>
                <p className="line-clamp-1 text-sm text-text-muted">{idea.description}</p>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-2 text-sm">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-1 font-bold ${
                      idea.net_score > 0
                        ? "text-green-400"
                        : idea.net_score < 0
                        ? "text-red-400"
                        : "text-text-muted"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    {idea.net_score > 0 ? "+" : ""}
                    {idea.net_score}
                  </div>
                  <div className="flex items-center gap-1 text-text-muted">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {idea.comments_count}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

