/**
 * Package image mapping utility.
 * Maps package names to appropriate images.
 */

import { toAbsoluteUrl } from "../lib/urls";

/**
 * Get the image path for a given package.
 * Returns the database image if available, otherwise falls back to default mapping.
 */
export function getPackageImage(packageName: string, packageImage?: string | null): string {
  // If package has an uploaded image, use it
  if (packageImage) {
    const absoluteUrl = toAbsoluteUrl(packageImage);
    return absoluteUrl || packageImage; // Fallback to original if toAbsoluteUrl returns null
  }
  
  // Otherwise, use default mapping
  const normalizedName = packageName.toLowerCase().trim();
  
  const imageMap: Record<string, string> = {
    "basic clean": "/img/packages/basic_clean.png",
    "standard clean": "/img/packages/standar_clean.png",
    "deep clean": "/img/packages/deep_clean.png",
  };

  // Check for exact match first
  if (imageMap[normalizedName]) {
    return imageMap[normalizedName];
  }

  // Check for partial matches - Order matters!
  
  // Deep Clean variations
  if (
    normalizedName.includes("deep") || 
    normalizedName.includes("mendalam") || 
    normalizedName.includes("rumah baru") ||
    normalizedName.includes("new house") ||
    normalizedName.includes("pindahan") ||
    normalizedName.includes("total")
  ) {
    return "/img/packages/deep_clean.png";
  }

  // Basic Clean variations
  if (
    normalizedName.includes("basic") || 
    normalizedName.includes("dasar") || 
    normalizedName.includes("kos") ||
    normalizedName.includes("studio")
  ) {
    return "/img/packages/basic_clean.png";
  }

  // Standard Clean variations
  if (
    normalizedName.includes("standard") || 
    normalizedName.includes("standar") ||
    normalizedName.includes("kamar") || // e.g. "2 Kamar", "Kamar Mandi"
    normalizedName.includes("bedroom") || // English for Kamar
    normalizedName.includes("bathroom") || // English for Kamar Mandi
    normalizedName.includes("apartemen") ||
    normalizedName.includes("apartment")
  ) {
    return "/img/packages/standar_clean.png";
  }

  // Default fallback image
  return "/img/packages/clean.png";
}

/**
 * Get the alt text for a package image.
 */
export function getPackageImageAlt(packageName: string): string {
  return `${packageName} - Cleaning Service`;
}
