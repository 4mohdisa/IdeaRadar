"use client";

import { use } from "react";
import Link from "next/link";
import Script from "next/script";
import { ScoreMeter } from "@/components/ui/score-meter";
import { ScoreBadge } from "@/components/ui/score-badge";
import { VoteButtons } from "@/components/ui/vote-buttons";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { SourceBadge } from "@/components/ui/source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommentsSection } from "@/components/ui/comments-section";
import { PageTransition } from "@/components/ui/page-transition";
import { MdEdit, MdVisibilityOff } from "react-icons/md";
import { 
  useGetIdeaByIdQuery, 
  useGetUserVoteQuery, 
  useGetBookmarkStatusQuery 
} from "@/lib/store";

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // RTK Query hooks - data is cached automatically
  const { 
    data: idea, 
    isLoading: loading, 
    isError,
    error 
  } = useGetIdeaByIdQuery(id);
  
  const { data: voteData } = useGetUserVoteQuery(id);
  const { data: bookmarkData } = useGetBookmarkStatusQuery(id);
  
  const userVote = voteData?.vote ?? null;
  const isBookmarked = bookmarkData?.isBookmarked ?? false;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // JSON-LD structured data
  const jsonLd = idea
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: idea.title,
        description: idea.description.substring(0, 200),
        articleBody: idea.body_text,
        datePublished: idea.created_at,
        author: {
          "@type": "Person",
          name: idea.author,
          url: `https://reddit.com/u/${idea.author}`,
        },
        publisher: {
          "@type": "Organization",
          name: "IdeaRadar",
          logo: {
            "@type": "ImageObject",
            url: "https://idearadar.com/logo-icon.png",
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://idearadar.com/idea/${idea.id}`,
        },
        url: `https://idearadar.com/idea/${idea.id}`,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: idea.upvotes,
          },
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: idea.comments_count,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-32 animate-shimmer rounded bg-border"></div>
        <div className="mx-auto max-w-4xl space-y-6 overflow-hidden">
          <div className="h-8 w-3/4 animate-shimmer rounded bg-border"></div>
          <div className="h-6 w-1/2 animate-shimmer rounded bg-border" style={{ animationDelay: "100ms" }}></div>
          <div className="h-64 animate-shimmer rounded-lg bg-border" style={{ animationDelay: "200ms" }}></div>
        </div>
      </div>
    );
  }

  if (isError || !idea) {
    return (
      <PageTransition>
        <div className="container px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-smooth hover:text-accent"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ideas
          </Link>
          <div className="animate-scale-in overflow-hidden rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-8">
            <p className="break-words text-red-400">Error: Idea not found</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-smooth hover:opacity-90 press-effect"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <>
      {/* JSON-LD for Article structured data */}
      {jsonLd && (
        <Script
          id="json-ld-article"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <PageTransition>
        <div className="container px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-smooth hover:text-accent"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ideas
          </Link>

          <div className="mx-auto max-w-4xl overflow-hidden">
            {/* Draft/Archived Banner */}
            {(idea.status === "draft" || idea.status === "archived") && (
              <div className={`mb-6 animate-slide-in-top rounded-lg border p-4 ${
                idea.status === "draft" 
                  ? "border-yellow-500/30 bg-yellow-500/10" 
                  : "border-gray-500/30 bg-gray-500/10"
              }`}>
                <div className="flex items-center gap-3">
                  {idea.status === "draft" ? (
                    <MdVisibilityOff className="h-5 w-5 shrink-0 text-yellow-400" />
                  ) : (
                    <MdEdit className="h-5 w-5 shrink-0 text-gray-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={idea.status} size="md" />
                      <span className={`text-sm font-medium ${
                        idea.status === "draft" ? "text-yellow-400" : "text-gray-400"
                      }`}>
                        {idea.status === "draft" 
                          ? "This idea is only visible to you" 
                          : "This idea has been archived"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {idea.status === "draft" 
                        ? "Publish this idea to make it visible to the community and receive feedback."
                        : "Archived ideas are hidden from the public feed."}
                    </p>
                  </div>
                  {idea.status === "draft" && (
                    <Link
                      href={`/edit/${idea.id}`}
                      className="shrink-0 rounded-lg bg-yellow-500/20 px-4 py-2 text-sm font-medium text-yellow-400 transition-smooth hover:bg-yellow-500/30 press-effect"
                    >
                      Edit & Publish
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Header Section */}
            <header className="mb-8 space-y-4 animate-slide-in-bottom">
              {/* Source Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <SourceBadge
                  source={idea.source}
                  subreddit={idea.source === "reddit" ? idea.subreddit : undefined}
                />
                {idea.status && idea.status !== "published" && (
                  <StatusBadge status={idea.status} size="md" />
                )}
                {idea.source === "reddit" && idea.post_url && (
                  <Link
                    href={idea.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-text-muted transition-smooth hover:text-accent"
                  >
                    <span>View on Reddit</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </Link>
                )}
              </div>

            {/* Title - H1 for SEO */}
            <h1 className="break-words text-2xl font-bold leading-tight text-text-main sm:text-3xl md:text-4xl">
              {idea.title}
            </h1>

             {/* Meta Information */}
             <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
               <div className="flex items-center gap-2">
                 {idea.author_avatar ? (
                   <img 
                     src={idea.author_avatar} 
                     alt={idea.author || "User"} 
                     className="h-5 w-5 rounded-full object-cover"
                   />
                 ) : (
                   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                     <path
                       fillRule="evenodd"
                       d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                       clipRule="evenodd"
                     />
                   </svg>
                 )}
                 {idea.author_username ? (
                   <Link 
                     href={`/profile/${idea.author_username}`}
                     className="text-text-main transition-smooth hover:text-accent hover:underline"
                   >
                     {idea.author || idea.author_username}
                   </Link>
                 ) : idea.source === "reddit" && idea.reddit_author ? (
                   <a
                     href={`https://reddit.com/u/${idea.reddit_author}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-text-main transition-smooth hover:text-accent hover:underline"
                   >
                     u/{idea.reddit_author}
                   </a>
                 ) : (
                   <span>{idea.author || "Anonymous"}</span>
                 )}
               </div>
               <span>•</span>
               <div>{formatDate(idea.created_at)}</div>
             </div>

            {/* Engagement Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <VoteButtons
                ideaId={idea.id}
                initialUpvotes={idea.upvotes}
                initialDownvotes={idea.downvotes}
                userVote={userVote}
                layout="horizontal"
              />
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex items-center gap-1 text-xs text-text-muted sm:text-sm">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{idea.comments_count}</span>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <BookmarkButton ideaId={idea.id} initialBookmarked={isBookmarked} showLabel={true} size="sm" />
            </div>
           </header>

           {/* Market Potential Analysis Section */}
           <section className="mb-8 overflow-hidden rounded-lg border border-accent/20 bg-accent/5 p-4 sm:p-6">
             <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-main sm:text-xl">
               <svg className="h-5 w-5 shrink-0 text-accent sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                 />
               </svg>
               <span className="break-words">Market Potential Analysis</span>
             </h2>

             {/* Score Display */}
             <div className="mb-6 flex items-center gap-6">
               <div className="flex flex-col items-center gap-2">
                 <div className="text-5xl font-bold text-accent">{idea.market_potential_score}</div>
                 <div className="text-sm text-text-muted">out of 100</div>
               </div>
               <div className="flex-1">
                 <ScoreMeter score={idea.market_potential_score} />
               </div>
             </div>

             {/* Score Badge */}
             <div className="mb-4">
               <ScoreBadge score={idea.market_potential_score} size="lg" />
             </div>

             {/* Analysis Explanation */}
             <div className="space-y-3 overflow-hidden text-sm leading-relaxed text-text-muted">
               <p className="break-words">
                 <strong className="text-text-main">What this score means:</strong> This AI-generated
                 score evaluates the idea across four key dimensions: Market Relevance (current demand),
                 Scalability Potential (growth capability), Monetization Simplicity (revenue clarity),
                 and Competition Level (market saturation).
               </p>

               {idea.market_potential_score >= 80 && (
                 <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 sm:p-4">
                   <p className="break-words font-medium text-green-400">
                     ⭐ Excellent Potential - This idea shows strong market demand, clear monetization
                     path, high scalability, and favorable competitive landscape. Worth serious
                     consideration and deep exploration.
                   </p>
                 </div>
               )}

               {idea.market_potential_score >= 60 && idea.market_potential_score < 80 && (
                 <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 sm:p-4">
                   <p className="break-words font-medium text-blue-400">
                     💡 Good Potential - This is a solid opportunity with clear strengths. While there
                     may be some challenges to overcome, the idea is generally viable with proper
                     execution. Consider pursuing with validation.
                   </p>
                 </div>
               )}

               {idea.market_potential_score >= 40 && idea.market_potential_score < 60 && (
                 <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4">
                   <p className="break-words font-medium text-yellow-400">
                     ⚠️ Moderate Potential - This idea has merit but faces significant challenges. Mixed
                     signals suggest careful validation is needed. May require pivots or significant
                     adjustments. Proceed with caution and thorough research.
                   </p>
                 </div>
               )}

               {idea.market_potential_score >= 20 && idea.market_potential_score < 40 && (
                 <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 sm:p-4">
                   <p className="break-words font-medium text-orange-400">
                     ⚡ Low Potential - This idea faces multiple obstacles and red flags. While not
                     impossible, it presents an uphill battle. Consider exploring alternative
                     approaches or other opportunities. Think twice before committing resources.
                   </p>
                 </div>
               )}

               {idea.market_potential_score < 20 && (
                 <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 sm:p-4">
                   <p className="break-words font-medium text-red-400">
                     🚫 Very Low Potential - This idea has major fundamental issues including unclear
                     monetization, limited scalability, or extremely high competition. Not recommended
                     without major rework or pivot. Better opportunities likely exist.
                   </p>
                 </div>
               )}

               <p className="break-words text-xs italic">
                 <strong>Disclaimer:</strong> This is an AI-generated, informational score and should
                 not be the sole basis for decisions. Consider your unique skills, resources, passion,
                 and market insights. Use this as a starting point for evaluation, not absolute truth.
               </p>
             </div>
           </section>

           {/* AI-Generated Description */}
           <section className="mb-8 rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-main">AI-Generated Summary</h2>
            <div className="prose prose-invert max-w-none">
              {idea.description.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-3 break-words leading-relaxed text-text-main last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Original Content Section */}
          <article className="rounded-lg border border-border bg-surface p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-text-main">Original Post</h2>
            <div className="prose prose-invert max-w-none overflow-hidden">
              {idea.body_text.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 break-words leading-relaxed text-text-main last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

           {/* Action Buttons */}
          <section className="mt-6 sm:mt-8">
            <h2 className="sr-only">Actions</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              {idea.source === "reddit" && idea.post_url && (
                <a
                  href={idea.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 border border-orange-500/30 px-6 py-3 font-medium text-orange-400 transition-opacity hover:opacity-90"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0C4.477 0 0 4.477 0 10c0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm4.5 11.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm-9 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm4.5 4.5c-1.657 0-3-1.343-3-3 0-.552.448-1 1-1h4c.552 0 1 .448 1 1 0 1.657-1.343 3-3 3z" />
                  </svg>
                  View Original on Reddit
                </a>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 font-medium transition-colors hover:bg-border"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>
          </section>

          {/* Disclaimer for Reddit Ideas */}
          {idea.source === "reddit" && (
            <aside className="mt-8 rounded-lg border border-border bg-surface/50 p-4">
              <p className="text-sm text-text-muted">
                This idea was originally posted on Reddit by u/{idea.reddit_author}. All content
                remains the property of the original author.{" "}
                {idea.post_url && (
                  <a
                    href={idea.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-accent hover:opacity-80"
                  >
                    View original post
                  </a>
                )}
              </p>
            </aside>
          )}

          {/* Comments Section */}
          <section id="comments" className="mt-12 animate-slide-in-bottom" style={{ animationDelay: "400ms" }}>
            <CommentsSection
              ideaId={idea.id}
              ideaAuthorId={idea.user_id}
            />
          </section>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
