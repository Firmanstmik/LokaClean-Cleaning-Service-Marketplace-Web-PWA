/**
 * Package Rating Display Component
 * 
 * Displays rating with stars, average rating, and review count.
 * Handles "no ratings yet" state gracefully.
 */

import { Star } from "lucide-react";

interface PackageRatingDisplayProps {
  averageRating: number | null | undefined;
  totalReviews: number | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function PackageRatingDisplay({
  averageRating,
  totalReviews = 0,
  size = "md",
  showLabel = false,
  className = ""
}: PackageRatingDisplayProps) {
  // Size configurations
  const sizeConfig = {
    sm: { star: "h-3 w-3", gap: "gap-0.5", text: "text-xs", ratingText: "text-[11px]" },
    md: { star: "h-3.5 w-3.5", gap: "gap-1", text: "text-xs", ratingText: "text-xs" },
    lg: { star: "h-4 w-4", gap: "gap-1.5", text: "text-sm", ratingText: "text-sm" }
  };

  const config = sizeConfig[size];

  // No ratings yet
  if (averageRating === null || averageRating === undefined || totalReviews === 0) {
    const textColorClass = className.includes('text-white') ? 'text-white/90' : 'text-slate-400';
    return (
      <div className={`flex items-center ${config.gap} ${className}`}>
        <span className={`${config.text} font-semibold ${textColorClass}`}>
          New
        </span>
        <span className={`${config.text} ${textColorClass}`}>•</span>
        <span className={`${config.text} ${textColorClass}`}>
          No ratings yet
        </span>
      </div>
    );
  }

  // Round to nearest whole number for star display (e.g., 4.3 -> 4, 4.7 -> 5)
  const roundedStars = Math.round(averageRating);

  const textColorClass = className.includes('text-white') ? 'text-white/90' : '';
  const ratingTextColor = textColorClass || 'text-slate-700';
  const separatorColor = textColorClass || 'text-slate-300';
  const reviewColor = textColorClass || 'text-slate-400';
  
  return (
    <div className={`flex items-center flex-wrap ${config.gap} ${className}`}>
      {/* Star Rating - Warm yellow, shown first, trustworthy feel */}
      <div className={`flex items-center ${config.gap}`}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= roundedStars;
          return (
            <Star
              key={starValue}
              className={`${config.star} ${
                isFilled
                  ? "text-amber-400 fill-amber-400"
                  : textColorClass ? "text-white/40 fill-white/40" : "text-slate-200 fill-slate-200"
              }`}
            />
          );
        })}
      </div>

      {/* Rating Number - Subtle, smaller than stars */}
      <span className={`${config.ratingText} font-medium ${ratingTextColor}`}>
        {averageRating.toFixed(1)}
      </span>

      {/* Separator - Soft dot */}
      <span className={`${config.text} ${separatorColor}`}>•</span>

      {/* Review Count - Very subtle, muted */}
      <span className={`${config.text} ${reviewColor}`}>
        {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
      </span>

      {/* Optional Label */}
      {showLabel && (
        <>
          <span className={`${config.text} ${separatorColor}`}>•</span>
          <span className={`${config.text} ${reviewColor}`}>
            Highly Rated
          </span>
        </>
      )}
    </div>
  );
}

