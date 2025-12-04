"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoChevronBack, IoCalendarOutline } from "react-icons/io5";
import { FaLightbulb, FaArrowUp, FaComments, FaStar, FaChartLine } from "react-icons/fa";
import { HiUserCircle } from "react-icons/hi";
import { PageTransition } from "@/components/ui/page-transition";
import { IdeaCard } from "@/components/ui/idea-card";
import type { Idea } from "@/lib/types";

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
}

interface UserAnalytics {
  totalIdeas: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalComments: number;
  avgScore: number;
  topScore: number;
  medianScore: number;
  publishedIdeas: number;
}

type SortOption = "recent" | "popular" | "score";

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/profile/${username}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        
        const data = await response.json();
        setProfile(data.profile);
        setAnalytics(data.analytics);
        setIdeas(data.ideas || []);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [username]);

  // Sort ideas
  const sortedIdeas = [...ideas].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case "score":
        return b.market_potential_score - a.market_potential_score;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button skeleton */}
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-border"></div>
        
        {/* Profile header skeleton */}
        <div className="mb-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-24 w-24 animate-pulse rounded-full bg-border sm:h-32 sm:w-32"></div>
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-border"></div>
              <div className="h-4 w-32 animate-pulse rounded bg-border"></div>
            </div>
          </div>
        </div>

        {/* Analytics skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>

        {/* Ideas skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-border"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile || !analytics) {
    return (
      <PageTransition>
        <div className="container px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-smooth hover:text-accent"
          >
            <IoChevronBack className="h-4 w-4" />
            Back to Ideas
          </Link>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
            <HiUserCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-text-main">
              {error || "User not found"}
            </h2>
            <p className="text-text-muted">
              The profile you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-smooth hover:opacity-90"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-smooth hover:text-accent"
        >
          <IoChevronBack className="h-4 w-4" />
          Back to Ideas
        </Link>

        {/* Profile Header */}
        <div className="mb-8 animate-slide-in-bottom rounded-xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  width={128}
                  height={128}
                  className="h-24 w-24 rounded-full border-4 border-accent/20 object-cover sm:h-32 sm:w-32"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-accent/20 bg-accent/10 sm:h-32 sm:w-32">
                  <HiUserCircle className="h-16 w-16 text-accent sm:h-20 sm:w-20" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-text-main sm:text-3xl">
                  {profile.displayName}
                </h1>
                <p className="text-text-muted">@{profile.username}</p>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <IoCalendarOutline className="h-4 w-4" />
                  <span>Joined {formatDate(profile.joinedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Ideas */}
          <div className="animate-scale-in rounded-xl border border-border bg-surface p-5 transition-smooth hover:border-accent/50" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <FaLightbulb className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-main">{analytics.totalIdeas}</p>
                <p className="text-sm text-text-muted">Total Ideas</p>
              </div>
            </div>
          </div>

          {/* Total Upvotes */}
          <div className="animate-scale-in rounded-xl border border-border bg-surface p-5 transition-smooth hover:border-green-500/50" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <FaArrowUp className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-main">{formatNumber(analytics.totalUpvotes)}</p>
                <p className="text-sm text-text-muted">Total Upvotes</p>
              </div>
            </div>
          </div>

          {/* Total Comments */}
          <div className="animate-scale-in rounded-xl border border-border bg-surface p-5 transition-smooth hover:border-blue-500/50" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <FaComments className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-main">{formatNumber(analytics.totalComments)}</p>
                <p className="text-sm text-text-muted">Comments Received</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Analytics */}
        {analytics.totalIdeas > 0 && (
          <div className="mb-8 animate-slide-in-bottom rounded-xl border border-border bg-surface p-6" style={{ animationDelay: "250ms" }}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-main">
              <FaChartLine className="h-5 w-5 text-accent" />
              Market Potential Scores
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Median Score */}
              <div className="text-center">
                <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-border"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${analytics.medianScore * 2.83} 283`}
                      strokeLinecap="round"
                      className={getScoreColor(analytics.medianScore)}
                    />
                  </svg>
                  <span className={`absolute text-2xl font-bold ${getScoreColor(analytics.medianScore)}`}>
                    {analytics.medianScore}
                  </span>
                </div>
                <p className="font-medium text-text-main">Median Score</p>
                <p className="text-sm text-text-muted">Across all ideas</p>
              </div>

              {/* Average Score */}
              <div className="text-center">
                <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-border"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${analytics.avgScore * 2.83} 283`}
                      strokeLinecap="round"
                      className={getScoreColor(analytics.avgScore)}
                    />
                  </svg>
                  <span className={`absolute text-2xl font-bold ${getScoreColor(analytics.avgScore)}`}>
                    {analytics.avgScore}
                  </span>
                </div>
                <p className="font-medium text-text-main">Average Score</p>
                <p className="text-sm text-text-muted">Mean of all scores</p>
              </div>

              {/* Top Score */}
              <div className="text-center">
                <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-border"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${analytics.topScore * 2.83} 283`}
                      strokeLinecap="round"
                      className={getScoreColor(analytics.topScore)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <FaStar className="mb-0.5 h-3 w-3 text-yellow-400" />
                    <span className={`text-2xl font-bold ${getScoreColor(analytics.topScore)}`}>
                      {analytics.topScore}
                    </span>
                  </div>
                </div>
                <p className="font-medium text-text-main">Top Score</p>
                <p className="text-sm text-text-muted">Highest rated idea</p>
              </div>
            </div>
          </div>
        )}

        {/* Ideas Section */}
        <div className="animate-slide-in-bottom" style={{ animationDelay: "300ms" }}>
          {/* Section Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-text-main">
              Ideas by {profile.displayName}
              <span className="ml-2 text-base font-normal text-text-muted">
                ({analytics.publishedIdeas} published)
              </span>
            </h2>

            {/* Sort Options */}
            {sortedIdeas.length > 0 && (
              <div className="flex gap-2">
                {(["recent", "popular", "score"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-smooth press-effect ${
                      sortBy === option
                        ? "bg-accent text-accent-foreground"
                        : "border border-border bg-surface hover:bg-border"
                    }`}
                  >
                    {option === "score" ? "Top Rated" : option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ideas Grid */}
          {sortedIdeas.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedIdeas.map((idea, index) => (
                <div
                  key={idea.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${350 + index * 50}ms` }}
                >
                  <IdeaCard idea={idea} userVote={null} isBookmarked={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-surface p-12 text-center">
              <FaLightbulb className="mx-auto mb-4 h-12 w-12 text-text-muted" />
              <h3 className="mb-2 text-lg font-semibold text-text-main">No ideas yet</h3>
              <p className="text-text-muted">
                {profile.displayName} hasn&apos;t published any ideas yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

