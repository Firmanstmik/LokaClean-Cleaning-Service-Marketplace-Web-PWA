/**
 * Utility functions for package icons and gradients.
 * Used across admin and user pages for consistent package representation.
 */

import {
  Package,
  Brush,
  Home,
  Droplets,
  Sparkle,
} from "lucide-react";

/**
 * Get appropriate icon for each package type - Modern mobile app style
 */
export function getPackageIcon(packageName: string) {
  const name = packageName.toLowerCase();
  if (name.includes("basic")) {
    return Brush; // Light cleaning - brush icon for quick tidy
  } else if (name.includes("standard")) {
    return Home; // Standard cleaning - home icon for full room
  } else if (name.includes("deep")) {
    return Droplets; // Deep cleaning - droplets/spray icon for intensive cleaning
  } else if (name.includes("premium") || name.includes("luxury")) {
    return Sparkle; // Premium packages - sparkle icon for luxury
  }
  return Package; // Default fallback
}

/**
 * Get appropriate gradient for each package type - Modern vibrant colors
 */
export function getPackageGradient(packageName: string) {
  const name = packageName.toLowerCase();
  if (name.includes("basic")) {
    return "from-amber-500 to-orange-600"; // Warm amber for basic
  } else if (name.includes("standard")) {
    return "from-blue-500 to-indigo-600"; // Cool blue for standard
  } else if (name.includes("deep")) {
    return "from-purple-500 to-pink-600"; // Rich purple for deep
  } else if (name.includes("premium") || name.includes("luxury")) {
    return "from-emerald-500 to-teal-600"; // Premium green for luxury
  }
  return "from-indigo-500 to-purple-600"; // Default gradient
}

