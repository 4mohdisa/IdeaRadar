import { FaReddit } from "react-icons/fa";
import { HiUserCircle } from "react-icons/hi2";

interface SourceBadgeProps {
  source: "reddit" | "user";
  subreddit?: string;
  size?: "sm" | "md";
}

export function SourceBadge({ source, subreddit, size = "md" }: SourceBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
  };

  if (source === "reddit") {
    return (
      <div
        className={`inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full bg-orange-500/10 ${sizeClasses[size]} font-medium text-orange-400`}
      >
        <FaReddit className="h-3 w-3 shrink-0" />
        <span className="truncate">{subreddit || "Reddit"}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full bg-accent/10 ${sizeClasses[size]} font-medium text-accent`}
    >
      <HiUserCircle className="h-3 w-3 shrink-0" />
      <span className="truncate">Community</span>
    </div>
  );
}

