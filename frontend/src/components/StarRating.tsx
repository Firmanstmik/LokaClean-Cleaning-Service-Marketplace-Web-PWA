/**
 * Interactive Star Rating Component
 * 
 * Features:
 * - Clickable stars (1-5)
 * - Hover effects (highlight stars up to hovered star)
 * - Visual feedback (selected rating locked)
 * - Smooth micro-interactions
 * - Mobile-friendly (tap optimized)
 * - Read-only mode support
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number; // Current rating value (0-5, 0 means no rating)
  onChange?: (value: number) => void; // Callback when rating changes
  readOnly?: boolean; // If true, stars are not clickable
  size?: "sm" | "md" | "lg"; // Size variant
  showLabel?: boolean; // Show rating text label
  className?: string;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = false,
  className = ""
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  // Size configurations
  const sizeConfig = {
    sm: { star: "h-4 w-4", gap: "gap-1", text: "text-xs" },
    md: { star: "h-6 w-6", gap: "gap-1.5", text: "text-sm" },
    lg: { star: "h-8 w-8", gap: "gap-2", text: "text-base" }
  };

  const config = sizeConfig[size];

  // Determine which stars should be filled
  const displayValue = hoveredValue !== null ? hoveredValue : value;

  // Rating labels
  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent"
  };

  const handleStarClick = (starValue: number) => {
    if (!readOnly && onChange) {
      onChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (!readOnly) {
      setHoveredValue(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredValue(null);
    }
  };

  return (
    <div 
      className={`flex flex-col items-start ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center ${config.gap}`}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayValue;
          const isSelected = starValue === value && value > 0;

          return (
            <motion.button
              key={starValue}
              type="button"
              disabled={readOnly}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
              className={`
                ${config.star}
                ${readOnly ? "cursor-default" : "cursor-pointer"}
                transition-all duration-200
                ${isSelected ? "scale-110" : ""}
              `}
              whileHover={!readOnly ? { scale: 1.15 } : {}}
              whileTap={!readOnly ? { scale: 0.95 } : {}}
              aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
            >
              <Star
                className={`
                  ${config.star}
                  transition-all duration-200
                  ${
                    isFilled
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-300"
                  }
                  ${isSelected ? "drop-shadow-lg" : ""}
                `}
                strokeWidth={isFilled ? 0 : 1.5}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Rating label */}
      {showLabel && value > 0 && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 ${config.text} font-medium text-slate-600`}
        >
          {ratingLabels[value as keyof typeof ratingLabels] || `${value}/5`}
        </motion.p>
      )}

      {/* Selected rating confirmation (only when rating is selected) */}
      {!readOnly && value > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-1.5 flex items-center gap-1.5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="h-1.5 w-1.5 rounded-full bg-teal-500"
          />
          <span className={`${config.text} font-medium text-teal-600`}>
            {value} {value === 1 ? "star" : "stars"} selected
          </span>
        </motion.div>
      )}
    </div>
  );
}

