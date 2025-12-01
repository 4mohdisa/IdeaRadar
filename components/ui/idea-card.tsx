import Link from "next/link";
import type { Idea } from "@/lib/types";
import { BiMessageRounded } from "react-icons/bi";
import { ScoreCircle } from "./score-circle";
import { VoteButtons } from "./vote-buttons";
import { BookmarkButton } from "./bookmark-button";
import { SourceBadge } from "./source-badge";

interface IdeaCardProps {
  idea: Idea;
  userVote?: "up" | "down" | null;
  isBookmarked?: boolean;
}

export function IdeaCard({ idea, userVote, isBookmarked }: IdeaCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent sm:p-6">
      {/* Header with Source and Score */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-12">
          <SourceBadge
            source={idea.source}
            subreddit={idea.source === "reddit" ? idea.subreddit : undefined}
          />
        </div>
        <div className="absolute right-4 top-4">
          <ScoreCircle score={idea.market_potential_score} size={44} />
        </div>
      </div>

      {/* Title - Clickable */}
      <Link href={`/idea/${idea.id}`} className="block">
        <h3 className="mb-3 break-words text-lg font-semibold leading-tight text-text-main group-hover:text-accent">
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
            className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent"
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
            <span className="break-words">by {idea.author}</span>
            <span>•</span>
          </>
        )}
        <span className="whitespace-nowrap">{formatDate(idea.created_at)}</span>
      </div>
    </div>
  );
}

