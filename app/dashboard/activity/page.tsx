"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Idea } from "@/lib/types";
import { IdeaCard } from "@/components/ui/idea-card";

type ActivityTab = "upvoted" | "downvoted" | "commented";

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("upvoted");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/activity?type=${activeTab}`);
        if (response.ok) {
          const data = await response.json();
          setIdeas(data.ideas || []);
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [activeTab]);

  const tabs = [
    {
      id: "upvoted" as ActivityTab,
      label: "Upvoted",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ),
    },
    {
      id: "downvoted" as ActivityTab,
      label: "Downvoted",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
    },
    {
      id: "commented" as ActivityTab,
      label: "Commented",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

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
        <h1 className="text-3xl font-bold text-text-main">Activity</h1>
        <p className="mt-2 text-text-muted">View your voting and commenting history</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-surface hover:bg-border"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            {tabs.find((t) => t.id === activeTab)?.icon}
          </div>
          <h3 className="mb-2 text-xl font-semibold text-text-main">
            No {activeTab} ideas yet
          </h3>
          <p className="mb-6 text-text-muted">
            {activeTab === "upvoted" && "Start upvoting ideas you find interesting!"}
            {activeTab === "downvoted" && "Ideas you downvote will appear here."}
            {activeTab === "commented" && "Join the discussion and comment on ideas!"}
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
            <IdeaCard
              key={idea.id}
              idea={idea}
              userVote={activeTab === "upvoted" ? "up" : activeTab === "downvoted" ? "down" : null}
              isBookmarked={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

