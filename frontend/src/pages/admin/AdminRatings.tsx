/**
 * ADMIN Rating Dashboard
 * 
 * Features:
 * - Rating overview cards (average, total, 5-star %)
 * - Rating distribution chart (bar visualization)
 * - Recent ratings card grid (mobile-friendly card layout)
 * - Filters and sorting
 * - Clean, modern UI matching LocaClean theme
 */

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, TrendingUp, BarChart3, Filter, Calendar, Package as PackageIcon, RefreshCw, Eye, AlertCircle, CheckCircle2, X, User, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatDateTimeWITA } from "../../utils/date";
import { StarRating } from "../../components/StarRating";
import { AnimatedCard } from "../../components/AnimatedCard";
import type { Rating } from "../../types/api";

interface RatingWithOrder extends Rating {
  pesanan: {
    id: number;
    paket: {
      id: number;
      name: string;
    };
    user: {
      id: number;
      full_name: string;
      email: string;
    };
  };
}

interface RatingSummary {
  average_rating: number;
  total_ratings: number;
  five_star_percentage: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function AdminRatingsPage() {
  const [ratings, setRatings] = useState<RatingWithOrder[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Filters
  const [packageFilter, setPackageFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "recent">("recent");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch packages for filter
  const [packages, setPackages] = useState<Array<{ id: number; name: string }>>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        // Use admin endpoint for admin pages
        const resp = await api.get("/admin/packages");
        // Response structure: resp.data.data.items (array of PaketCleaning)
        const packagesData = resp.data.data.items || [];
        // Map to the format we need: { id, name }
        const formattedPackages = packagesData.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name
        }));
        setPackages(formattedPackages);
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        // Try public endpoint as fallback
        try {
          const publicResp = await api.get("/packages");
          const publicPackages = publicResp.data.data.items || [];
          const formattedPackages = publicPackages.map((pkg: any) => ({
            id: pkg.id,
            name: pkg.name
          }));
          setPackages(formattedPackages);
        } catch (publicErr) {
          console.error("Failed to fetch packages from public endpoint:", publicErr);
        }
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // Fetch ratings and summary
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (packageFilter) params.append("package_id", packageFilter);
        if (ratingFilter) params.append("rating_value", ratingFilter);
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        params.append("sort", sortBy);
        params.append("page", currentPage.toString());
        params.append("limit", "10");

        // Build summary params (include package filter if selected)
        const summaryParams = new URLSearchParams();
        if (packageFilter) summaryParams.append("package_id", packageFilter);
        if (startDate) summaryParams.append("start_date", startDate);
        if (endDate) summaryParams.append("end_date", endDate);

        const [ratingsResp, summaryResp] = await Promise.all([
          api.get(`/admin/ratings?${params.toString()}`),
          api.get(`/admin/ratings/summary?${summaryParams.toString()}`)
        ]);

        setRatings(ratingsResp.data.data.ratings || []);
        setPagination(ratingsResp.data.data.pagination || null);
        setSummary(summaryResp.data.data || null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [packageFilter, ratingFilter, startDate, endDate, sortBy, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageFilter, ratingFilter, startDate, endDate, sortBy]);

  // Calculate max count for distribution chart
  const maxDistributionCount = useMemo(() => {
    if (!summary) return 1;
    return Math.max(...Object.values(summary.distribution));
  }, [summary]);

  const handleClearFilters = () => {
    setPackageFilter("");
    setRatingFilter("");
    setStartDate("");
    setEndDate("");
    setSortBy("recent");
    setCurrentPage(1);
  };

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (packageFilter) params.append("package_id", packageFilter);
      if (ratingFilter) params.append("rating_value", ratingFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("sort", sortBy);
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      // Build summary params (include package filter if selected)
      const summaryParams = new URLSearchParams();
      if (packageFilter) summaryParams.append("package_id", packageFilter);
      if (startDate) summaryParams.append("start_date", startDate);
      if (endDate) summaryParams.append("end_date", endDate);

      const [ratingsResp, summaryResp] = await Promise.all([
        api.get(`/admin/ratings?${params.toString()}`),
        api.get(`/admin/ratings/summary?${summaryParams.toString()}`)
      ]);

      setRatings(ratingsResp.data.data.ratings || []);
      setPagination(ratingsResp.data.data.pagination || null);
      setSummary(summaryResp.data.data || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header - Consistent with other pages */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Star className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Ratings & Reviews
              </h1>
              {summary && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-black shadow-md shadow-indigo-500/30"
                >
                  {summary.total_ratings}
                </motion.span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium">Monitor service quality and customer satisfaction</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={refresh}
          className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Summary Cards - Horizontal Scrollable Layout */}
        {summary && (
          <div className="relative">
            {/* Scrollable container */}
            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-3 sm:gap-4 min-w-max">
                {/* Average Rating */}
                <AnimatedCard delay={0.1} className="card-lombok relative overflow-hidden p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-teal-100 shadow-lg shadow-teal-500/5 flex-shrink-0 w-[280px] sm:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50">
                  <Star className="h-5 w-5 text-teal-600 fill-teal-600" />
                </div>
                <div className="flex items-center gap-2">
                  {packageFilter && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                    >
                      Filtered
                    </motion.div>
                  )}
                  <TrendingUp className="h-4 w-4 text-teal-500" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1.5">
                {summary.average_rating.toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mb-3">
                Average Rating
                {packageFilter && (
                  <span className="ml-1.5 text-indigo-600 font-semibold">
                    ({packages.find(p => p.id.toString() === packageFilter)?.name || "Selected Package"})
                  </span>
                )}
              </div>
              <div>
                <StarRating
                  value={Math.round(summary.average_rating)}
                  readOnly={true}
                  size="sm"
                />
              </div>
            </AnimatedCard>

                {/* Total Ratings */}
                <AnimatedCard delay={0.15} className="card-lombok relative overflow-hidden p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-blue-100 shadow-lg shadow-blue-500/5 flex-shrink-0 w-[280px] sm:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                {packageFilter && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                  >
                    Filtered
                  </motion.div>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1.5">
                {summary.total_ratings.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500">
                Total Ratings
                {packageFilter && (
                  <span className="ml-1.5 text-indigo-600 font-semibold">
                    (Filtered)
                  </span>
                )}
              </div>
            </AnimatedCard>

                {/* 5-Star Percentage */}
                <AnimatedCard delay={0.2} className="card-lombok relative overflow-hidden p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-amber-100 shadow-lg shadow-amber-500/5 flex-shrink-0 w-[280px] sm:w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50">
                  <Star className="h-5 w-5 text-amber-600 fill-amber-600" />
                </div>
                {packageFilter && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                  >
                    Filtered
                  </motion.div>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1.5">
                {summary.five_star_percentage.toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500">
                5-Star Ratings
                {packageFilter && (
                  <span className="ml-1.5 text-indigo-600 font-semibold">
                    (Filtered)
                  </span>
                )}
              </div>
                </AnimatedCard>
              </div>
            </div>
            
            {/* Scroll indicator - subtle hint */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 hidden sm:block">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Rating Distribution Chart - Using AnimatedCard */}
        {summary && (
          <AnimatedCard delay={0.25} className="card-lombok p-4 sm:p-6 backdrop-blur-sm bg-white/90 border border-indigo-100/50 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Rating Distribution
              </h2>
            </div>
            <div className="space-y-3 sm:space-y-3.5">
              {[5, 4, 3, 2, 1].map((starValue) => {
                const count = summary.distribution[starValue as keyof typeof summary.distribution];
                const percentage = summary.total_ratings > 0
                  ? (count / summary.total_ratings) * 100
                  : 0;

                return (
                  <div key={starValue} className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-[70px] sm:min-w-[80px]">
                      <span className="text-sm font-semibold text-slate-700 w-4">
                        {starValue}
                      </span>
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-5 sm:h-6 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.3 + starValue * 0.05 }}
                          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-end pr-2"
                        >
                          {count > 0 && (
                            <span className="text-[10px] sm:text-xs font-semibold text-white">
                              {count}
                            </span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-600 min-w-[45px] text-right">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimatedCard>
        )}

        {/* Filters and Sort - Using AnimatedCard */}
        <AnimatedCard delay={0.3} className="card-lombok p-4 sm:p-5 backdrop-blur-sm bg-white/90 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Filters & Sort</h2>
            </div>
            {(packageFilter || ratingFilter || startDate || endDate || sortBy !== "recent") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Package Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <div className="flex items-center gap-1.5">
                  <PackageIcon className="h-4 w-4 text-indigo-600" />
                  <span>Package</span>
                  {packageFilter && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-indigo-500 text-white text-[8px] font-bold"
                    >
                      1
                    </motion.span>
                  )}
                </div>
              </label>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                disabled={packagesLoading}
                className={`w-full rounded-xl border-2 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                  packageFilter 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-slate-200 focus:border-indigo-500"
                }`}
              >
                <option value="">All Packages</option>
                {packagesLoading ? (
                  <option value="" disabled>Loading packages...</option>
                ) : packages.length > 0 ? (
                  packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id.toString()}>
                      {pkg.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No packages available</option>
                )}
              </select>
              {packageFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Filtered by package</span>
                </motion.div>
              )}
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <Star className="h-4 w-4 inline mr-1" />
                Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((val) => (
                  <option key={val} value={val}>
                    {val} Star{val > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Sort */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "highest" | "lowest" | "recent")}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>

          </div>
        </AnimatedCard>

        {/* Ratings Cards - Mobile-friendly card layout */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Recent Ratings
            </h2>
            {pagination && (
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                ({pagination.total} total)
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"
              />
            </div>
          ) : ratings.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white border border-slate-200">
              <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-slate-600 font-medium">No ratings found</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Card Grid - Mobile-first responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {ratings.map((rating, index) => (
                  <motion.div
                    key={rating.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-white border-2 border-slate-200/60 hover:border-indigo-300/60 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    {/* Rating badge - top right */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                        rating.rating_value === 5 ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white" :
                        rating.rating_value === 4 ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white" :
                        rating.rating_value === 3 ? "bg-gradient-to-r from-purple-400 to-pink-500 text-white" :
                        rating.rating_value === 2 ? "bg-gradient-to-r from-orange-400 to-red-500 text-white" :
                        "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                      }`}>
                        <Star className="h-3 w-3 fill-current" />
                        <span>{rating.rating_value}</span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      {/* Order ID & Date Row */}
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          to={`/admin/orders/${rating.pesanan.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors group-hover:scale-105"
                        >
                          <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>#{rating.pesanan.order_number}</span>
                        </Link>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="hidden sm:inline">{formatDateTimeWITA(rating.created_at)}</span>
                          <span className="sm:hidden">{formatDateTimeWITA(rating.created_at).split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Package */}
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                          <PackageIcon className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate flex-1">
                          {rating.pesanan.paket.name}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                            <User className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {rating.pesanan.user.full_name}
                            </div>
                            <div className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">
                              {rating.pesanan.user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="mb-3 pb-3 border-b border-slate-100">
                        <StarRating
                          value={rating.rating_value}
                          readOnly={true}
                          size="sm"
                        />
                      </div>

                      {/* Review */}
                      <div className="min-h-[40px]">
                        {rating.review ? (
                          <div className="text-xs sm:text-sm text-slate-600 line-clamp-3 break-words leading-relaxed">
                            "{rating.review}"
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-slate-400 italic">No review provided</span>
                        )}
                      </div>
                    </div>

                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-xl sm:rounded-2xl" />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-50/50 to-indigo-50/30 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="text-xs sm:text-sm text-slate-600 font-medium text-center sm:text-left">
                    Showing <span className="font-bold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                    <span className="font-bold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                    <span className="font-bold text-slate-900">{pagination.total}</span> ratings
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Previous
                    </motion.button>
                    <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNext}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Next
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
    </div>
  );
}

