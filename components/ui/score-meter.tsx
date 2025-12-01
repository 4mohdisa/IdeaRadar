interface ScoreMeterProps {
  score: number;
  showLabel?: boolean;
}

export function ScoreMeter({ score, showLabel = true }: ScoreMeterProps) {
  const percentage = score;

  const getColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const getLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Low";
    return "Very Low";
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-text-muted">Market Potential</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-main">{score}/100</span>
            <span className="text-xs text-text-muted">({getLabel(score)})</span>
          </div>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${percentage}%` }}
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Market potential score: ${score} out of 100`}
        />
      </div>
    </div>
  );
}

