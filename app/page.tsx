"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import type { Idea } from "@/lib/types";
import { IdeaCard } from "@/components/ui/idea-card";
import { AdvancedSearch } from "@/components/ui/advanced-search";
import { PageTransition } from "@/components/ui/page-transition";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [minScore, setMinScore] = useState(0);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [topIdeas, setTopIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sortOptions = [
    { value: "popular", label: "Most Popular" },
    { value: "recent", label: "Most Recent" },
    { value: "comments", label: "Most Discussed" },
    { value: "score", label: "Highest Potential" },
  ];

  // Fetch top 3 ideas on mount
  useEffect(() => {
    const fetchTopIdeas = async () => {
      try {
        const response = await fetch("/api/ideas?limit=3&sort=score");
        if (response.ok) {
          const data = await response.json();
          setTopIdeas(data.ideas || []);
        }
      } catch (err) {
        console.error("Failed to fetch top ideas:", err);
      }
    };
    fetchTopIdeas();
  }, []);

  // Auto-scroll carousel on mobile
  useEffect(() => {
    if (topIdeas.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % topIdeas.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [topIdeas.length]);

  // Fetch ideas from API
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          sort: sortBy,
        });

        if (searchQuery) params.append("search", searchQuery);
        if (minScore > 0) params.append("minScore", minScore.toString());

        const response = await fetch(`/api/ideas?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch ideas");
        }

        const data = await response.json();
        setIdeas(data.ideas || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [page, sortBy, searchQuery, minScore]);

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "IdeaRadar",
    description: "Discover startup ideas from Reddit's most active entrepreneurial communities",
    url: "https://idearadar.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://idearadar.com/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "IdeaRadar",
      logo: {
        "@type": "ImageObject",
        url: "https://idearadar.com/logo-icon.png",
      },
    },
  };

  return (
    <>
      {/* JSON-LD for structured data */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageTransition>
        <div className="container py-8">
        {/* Hidden H1 for SEO - visually hidden but accessible to screen readers and search engines */}
        <h1 className="sr-only">
          Discover Startup Ideas from Reddit - Browse Thousands of Business Ideas from Top Entrepreneurial Communities
        </h1>

      {/* Top 3 Ideas Carousel */}
      {topIdeas.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main sm:text-2xl">
              🔥 Top Ideas This Week
            </h2>
            {/* Carousel Dots - Mobile only */}
            <div className="flex gap-2 md:hidden">
              {topIdeas.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    currentSlide === index ? "w-6 bg-accent" : "bg-border"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mobile: Auto-scroll Carousel, Desktop: Grid */}
          <div className="relative md:hidden">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {topIdeas.map((idea, index) => (
                  <Link
                    key={idea.id}
                    href={`/idea/${idea.id}`}
                    className="group relative w-full flex-shrink-0 overflow-hidden rounded-lg border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6 transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/20"
                  >
                    {/* Rank Badge */}
                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="mb-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {idea.market_potential_score}
                        </div>
                        {idea.source === "reddit" ? (
                          <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400">
                            {idea.subreddit}
                          </span>
                        ) : (
                          <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                            Community
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 line-clamp-2 font-semibold leading-tight text-text-main group-hover:text-accent">
                        {idea.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-text-muted">
                        {idea.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {idea.upvotes}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {idea.comments_count}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden gap-4 md:grid md:grid-cols-3">
            {topIdeas.map((idea, index) => (
              <Link
                key={idea.id}
                href={`/idea/${idea.id}`}
                className="group relative overflow-hidden rounded-lg border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6 transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/20"
              >
                {/* Rank Badge */}
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {idea.market_potential_score}
                    </div>
                    {idea.source === "reddit" ? (
                      <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400">
                        {idea.subreddit}
                      </span>
                    ) : (
                      <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                        Community
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 line-clamp-2 font-semibold leading-tight text-text-main group-hover:text-accent">
                    {idea.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-text-muted">
                    {idea.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {idea.upvotes}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {idea.comments_count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {/* Search and Filters */}
      <div className="mb-6 sm:mb-8">
        {/* Search Bar with Filter Button */}
        <div className="flex gap-2">
          <AdvancedSearch
            onSearch={(query) => {
              setSearchQuery(query);
              setPage(1); // Reset to first page on new search
            }}
            initialQuery={searchQuery}
            placeholder="Search ideas by keyword, category, or topic..."
          />

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main transition-colors hover:bg-border"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {minScore > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-accent"></span>
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="hidden rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent md:block"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Score Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">
                  Min Score
                </label>
                <select
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="0">All Ideas</option>
                  <option value="80">Excellent (80+)</option>
                  <option value="60">Good (60+)</option>
                  <option value="40">Moderate (40+)</option>
                  <option value="20">Low (20+)</option>
                </select>
              </div>

              {/* Sort By - Mobile */}
              <div className="md:hidden">
                <label className="mb-2 block text-sm font-medium text-text-main">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-main focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {minScore > 0 && (
              <button
                onClick={() => {
                  setMinScore(0);
                }}
                className="text-sm text-accent transition-opacity hover:opacity-80"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-shimmer rounded-lg border border-border bg-surface p-6"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-3 h-6 w-32 rounded-full bg-border"></div>
              <div className="mb-3 h-6 w-full rounded bg-border"></div>
              <div className="mb-4 space-y-2">
                <div className="h-4 w-full rounded bg-border"></div>
                <div className="h-4 w-full rounded bg-border"></div>
                <div className="h-4 w-2/3 rounded bg-border"></div>
              </div>
              <div className="flex items-center gap-4 border-t border-border pt-4">
                <div className="h-4 w-12 rounded bg-border"></div>
                <div className="h-4 w-12 rounded bg-border"></div>
                <div className="ml-auto h-4 w-20 rounded bg-border"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="animate-scale-in rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-smooth hover:opacity-90 press-effect"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && ideas.length === 0 && (
        <div className="animate-scale-in rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-text-muted">
            No ideas found. Try adjusting your filters or{" "}
            <button
              onClick={async () => {
                const res = await fetch("/api/ideas/fetch", { method: "POST" });
                if (res.ok) window.location.reload();
              }}
              className="text-accent transition-smooth hover:opacity-80"
            >
              fetch new ideas
            </button>
            .
          </p>
        </div>
      )}

       {/* Ideas Gallery */}
       {!loading && !error && ideas.length > 0 && (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {ideas.map((idea, index) => (
             <div
               key={idea.id}
               className="animate-scale-in"
               style={{ animationDelay: `${index * 50}ms` }}
             >
               <IdeaCard
                 idea={idea}
                 userVote={null} // TODO: Pass actual user vote from context/auth
                 isBookmarked={false} // TODO: Pass actual bookmark status
               />
             </div>
           ))}
         </div>
       )}

      {/* Pagination */}
      {!loading && !error && ideas.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2 animate-fade-in">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-smooth hover:bg-border disabled:opacity-50 press-effect"
          >
            Previous
          </button>
          <span className="px-4 text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-smooth hover:bg-border disabled:opacity-50 press-effect"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </PageTransition>
    </>
  );
}
