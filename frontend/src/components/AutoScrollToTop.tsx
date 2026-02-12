import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls to the top of the page on route transitions.
 */
export function AutoScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top (no smooth animation) for page transitions
    // to feel like a fresh page load.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
