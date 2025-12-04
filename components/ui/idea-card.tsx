import Link from "next/link";
import type { Idea } from "@/lib/types";
import { BiMessageRounded } from "react-icons/bi";
import { ScoreCircle } from "./score-circle";
import { VoteButtons } from "./vote-buttons";
import { BookmarkButton } from "./bookmark-button";
import { SourceBadge } from "./source-badge";
import { StatusBadge } from "./status-badge";

interface IdeaCardProps {
  idea: Idea;
  userVote?: "up" | "down" | null;
  isBookmarked?: boolean;
  showStatus?: boolean;
}

export function IdeaCard({ idea, userVote, isBookmarked, showStatus = false }: IdeaCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isDraft = idea.status === "draft";
  const isArchived = idea.status === "archived";

  return (
    <div className={`group relative overflow-hidden rounded-lg border bg-surface p-4 transition-smooth hover:shadow-lg sm:p-6 ${
      isDraft 
        ? "border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-yellow-500/5" 
        : isArchived
        ? "border-gray-500/30 hover:border-gray-500/50 hover:shadow-gray-500/5 opacity-75"
        : "border-border hover:border-accent hover:shadow-accent/5"
    }`}>
      {/* Draft/Archived Overlay Indicator */}
      {(isDraft || isArchived) && (
        <div className={`absolute left-0 top-0 h-1 w-full ${isDraft ? "bg-yellow-500" : "bg-gray-500"}`} />
      )}

      {/* Header with Source, Status, and Score */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge
              source={idea.source}
              subreddit={idea.source === "reddit" ? idea.subreddit : undefined}
            />
            {/* Show status badge if showStatus is true OR if idea is draft/archived */}
            {(showStatus || isDraft || isArchived) && idea.status && (
              <StatusBadge status={idea.status} size="sm" />
            )}
          </div>
        </div>
        <div className="absolute right-4 top-4 transition-transform duration-300 group-hover:scale-110">
          <ScoreCircle score={idea.market_potential_score} size={44} />
        </div>
      </div>

      {/* Title - Clickable */}
      <Link href={`/idea/${idea.id}`} className="block">
        <h3 className="mb-3 break-words text-lg font-semibold leading-tight text-text-main transition-colors duration-200 group-hover:text-accent">
          {idea.title}
        </h3>
      </Link>

      {/* Preview Text */}
      <p className="mb-4 line-clamp-3 break-words text-sm leading-relaxed text-text-muted">
        {idea.description}
      </p>

      {/* Engagement Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {/* Left: Voting */}
        <div className="shrink-0">
          <VoteButtons
            ideaId={idea.id}
            initialUpvotes={idea.upvotes}
            initialDownvotes={idea.downvotes}
            userVote={userVote}
            layout="horizontal"
            showCount={true}
          />
        </div>

        {/* Right: Comments & Bookmark */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Comments */}
          <Link
            href={`/idea/${idea.id}#comments`}
            className="flex items-center gap-1 text-xs text-text-muted transition-smooth hover:text-accent"
          >
            <BiMessageRounded className="h-4 w-4 shrink-0" />
            <span>{idea.comments_count}</span>
          </Link>

          {/* Bookmark */}
          <BookmarkButton ideaId={idea.id} initialBookmarked={isBookmarked} size="sm" />
        </div>
      </div>

      {/* Footer: Author/Date */}
      <div className="mt-3 flex flex-wrap items-center gap-2 overflow-hidden text-xs text-text-muted">
        {idea.source === "user" && idea.author && (
          <>
            <span className="break-words">
              by{" "}
              <Link
                href={`/profile/${idea.author.toLowerCase().replace(/\s+/g, "")}`}
                className="transition-smooth hover:text-accent"
                onClick={(e) => e.stopPropagation()}
              >
                {idea.author}
              </Link>
            </span>
            <span>•</span>
          </>
        )}
        <span className="whitespace-nowrap">{formatDate(idea.created_at)}</span>
      </div>
    </div>
  );
}

