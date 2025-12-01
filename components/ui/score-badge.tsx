interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = "md", showLabel = true }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    if (score >= 20) return "text-orange-500";
    return "text-red-500";
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-blue-500/10";
    if (score >= 40) return "bg-yellow-500/10";
    if (score >= 20) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  const getBorderColor = (score: number) => {
    if (score >= 80) return "border-green-500/30";
    if (score >= 60) return "border-blue-500/30";
    if (score >= 40) return "border-yellow-500/30";
    if (score >= 20) return "border-orange-500/30";
    return "border-red-500/30";
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Low";
    return "Very Low";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${getBgColor(score)} ${getBorderColor(score)} ${sizeClasses[size]}`}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Market potential score: ${score} out of 100`}
    >
      <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
      {showLabel && (
        <>
          <span className="text-text-muted">•</span>
          <span className="text-text-muted">{getLabel(score)}</span>
        </>
      )}
    </div>
  );
}

