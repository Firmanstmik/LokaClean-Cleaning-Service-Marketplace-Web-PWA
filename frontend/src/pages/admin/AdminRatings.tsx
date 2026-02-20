/**
 * ADMIN Rating Dashboard
 * 
 * Features:
 * - Rating overview cards (average, total, 5-star %)
 * - Rating distribution chart (bar visualization)
 * - Recent ratings card grid (mobile-friendly card layout)
 * - Filters and sorting
 * - Clean, modern UI matching LokaClean theme
 */

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  TrendingUp,
  BarChart3,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatDateTimeWITA } from "../../utils/date";

function formatOrderNumber(orderNumber: number | null | undefined): string {
  if (!orderNumber) return "-";
  return `LC-${orderNumber.toString().padStart(4, "0")}`;
}
import { StarRating } from "../../components/StarRating";
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

type Sentiment = "positive" | "neutral" | "negative";

interface MonthlyTrendPoint {
  key: string;
  label: string;
  averageRating: number | null;
  totalRatings: number;
}

export function AdminRatingsPage() {
  const [ratings, setRatings] = useState<RatingWithOrder[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [packageFilter, setPackageFilter] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "recent">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [packages, setPackages] = useState<Array<{ id: number; name: string }>>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [monthTotalRatings, setMonthTotalRatings] = useState<number | null>(null);
  const [trendRange, setTrendRange] = useState<3 | 6 | 12>(6);
  const [trendData, setTrendData] = useState<MonthlyTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        // Use admin endpoint for admin pages
        const resp = await api.get("/admin/packages");
        const packagesData = resp.data.data.items as Array<{ id: number; name: string }> | undefined;
        const formattedPackages = (packagesData ?? []).map((pkg) => ({
          id: pkg.id,
          name: pkg.name
        }));
        setPackages(formattedPackages);
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        // Try public endpoint as fallback
        try {
          const publicResp = await api.get("/packages");
          const publicPackages = publicResp.data.data.items as Array<{ id: number; name: string }> | undefined;
          const formattedPackages = (publicPackages ?? []).map((pkg) => ({
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

  useEffect(() => {
    setCurrentPage(1);
  }, [packageFilter, ratingFilter, startDate, endDate, sortBy]);

  useEffect(() => {
    const fetchCurrentMonthSummary = async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
        const params = new URLSearchParams();
        params.append("start_date", toIsoDate(start));
        params.append("end_date", toIsoDate(end));
        const resp = await api.get(`/admin/ratings/summary?${params.toString()}`);
        const data: RatingSummary | null = resp.data.data || null;
        if (data) {
          setMonthTotalRatings(data.total_ratings);
        }
      } catch (err) {
        console.error("Failed to fetch monthly ratings summary", err);
      }
    };
    fetchCurrentMonthSummary();
  }, []);

  useEffect(() => {
    const fetchTrend = async () => {
      setTrendLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("sort", "recent");
        params.append("page", "1");
        params.append("limit", "500");
        const resp = await api.get(`/admin/ratings?${params.toString()}`);
        const data: RatingWithOrder[] = resp.data.data.ratings || [];

        const now = new Date();
        const months: MonthlyTrendPoint[] = [];
        const bucketMap = new Map<
          string,
          { sum: number; count: number; label: string }
        >();

        for (let i = trendRange - 1; i >= 0; i -= 1) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
          const label = d.toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          });
          bucketMap.set(key, { sum: 0, count: 0, label });
        }

        data.forEach((rating) => {
          const d = new Date(rating.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
          const bucket = bucketMap.get(key);
          if (bucket) {
            bucket.sum += rating.rating_value;
            bucket.count += 1;
          }
        });

        bucketMap.forEach((value, key) => {
          months.push({
            key,
            label: value.label,
            averageRating:
              value.count > 0 ? value.sum / value.count : null,
            totalRatings: value.count,
          });
        });

        months.sort((a, b) => (a.key < b.key ? -1 : 1));
        setTrendData(months);
      } catch (err) {
        console.error("Failed to fetch rating trend data", err);
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [trendRange]);

  const distributionTotal = useMemo(() => {
    if (!summary) return 0;
    return Object.values(summary.distribution).reduce((acc, value) => acc + value, 0);
  }, [summary]);

  const thisMonthFromPage = useMemo(() => {
    if (ratings.length === 0) return 0;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return ratings.filter((rating) => {
      const date = new Date(rating.created_at);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;
  }, [ratings]);

  const ratingsThisMonth = monthTotalRatings ?? thisMonthFromPage;

  const sentimentCounts = useMemo(() => {
    const base = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    if (!ratings.length) return base;
    ratings.forEach((rating) => {
      if (rating.rating_value >= 4) {
        base.positive += 1;
      } else if (rating.rating_value === 3) {
        base.neutral += 1;
      } else {
        base.negative += 1;
      }
    });
    return base;
  }, [ratings]);

  const totalSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;

  const sentimentPercentages = {
    positive:
      totalSentiment > 0
        ? (sentimentCounts.positive / totalSentiment) * 100
        : 0,
    neutral:
      totalSentiment > 0
        ? (sentimentCounts.neutral / totalSentiment) * 100
        : 0,
    negative:
      totalSentiment > 0
        ? (sentimentCounts.negative / totalSentiment) * 100
        : 0,
  };

  function getSentiment(rating: RatingWithOrder): Sentiment {
    if (rating.rating_value >= 4) return "positive";
    if (rating.rating_value === 3) return "neutral";
    return "negative";
  }

  const insights = useMemo(() => {
    const items: string[] = [];
    if (!summary || summary.total_ratings === 0) return items;

    if (totalSentiment > 0) {
      items.push(
        `${sentimentPercentages.positive.toFixed(
          1,
        )}% ulasan bernada positif berdasarkan analisis AI.`,
      );
    } else {
      items.push(
        `${summary.five_star_percentage.toFixed(
          1,
        )}% ulasan memberikan rating 5 bintang.`,
      );
    }

    const entries = Object.entries(summary.distribution) as Array<
      [string, number]
    >;
    if (entries.length > 0 && distributionTotal > 0) {
      const [topRatingValue] = entries.reduce<[string, number]>(
        (best, current) => (current[1] > best[1] ? current : best),
        entries[0],
      );
      const topValueNumber = Number(topRatingValue) as 1 | 2 | 3 | 4 | 5;
      const share =
        (summary.distribution[topValueNumber] / distributionTotal) * 100;
      items.push(
        `Rating ${topRatingValue} bintang menyumbang ${share.toFixed(
          1,
        )}% dari semua ulasan.`,
      );
    }

    const negativeReviews = ratings.filter(
      (rating) => getSentiment(rating) === "negative" && rating.review,
    );
    if (negativeReviews.length > 0) {
      const keywords = [
        {
          id: "keterlambatan",
          label: "keterlambatan kedatangan petugas",
          tokens: ["telat", "terlambat", "lama datang", "delay"],
        },
        {
          id: "kebersihan",
          label: "kualitas kebersihan hasil akhir",
          tokens: ["kurang bersih", "tidak bersih", "masih kotor", "kurang rapi"],
        },
        {
          id: "komunikasi",
          label: "komunikasi dengan petugas",
          tokens: ["sulit dihubungi", "komunikasi", "balas pesan lama"],
        },
      ] as const;

      const counters: Record<(typeof keywords)[number]["id"], number> = {
        keterlambatan: 0,
        kebersihan: 0,
        komunikasi: 0,
      };

      negativeReviews.forEach((rating) => {
        const text = (rating.review || "").toLowerCase();
        keywords.forEach((kw) => {
          if (kw.tokens.some((token) => text.includes(token))) {
            counters[kw.id] += 1;
          }
        });
      });

      const sorted = keywords
        .map((kw) => ({ kw, count: counters[kw.id] }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);

      if (sorted.length > 0) {
        items.push(
          `Keluhan terbanyak terkait ${sorted[0].kw.label}.`,
        );
      }
    }

    const nonEmptyTrend = trendData.filter((point) => point.totalRatings > 0);
    if (nonEmptyTrend.length >= 2) {
      const latest = nonEmptyTrend[nonEmptyTrend.length - 1];
      const previous = nonEmptyTrend[nonEmptyTrend.length - 2];
      if (
        latest.averageRating !== null &&
        previous.averageRating !== null &&
        previous.averageRating > 0
      ) {
        const diffPercent =
          ((latest.averageRating - previous.averageRating) /
            previous.averageRating) *
          100;
        const sign = diffPercent >= 0 ? "meningkat" : "menurun";
        items.push(
          `Kepuasan pelanggan ${sign} ${Math.abs(diffPercent).toFixed(
            1,
          )}% dibanding bulan sebelumnya.`,
        );
      }
    }

    return items;
  }, [
    summary,
    ratings,
    distributionTotal,
    totalSentiment,
    sentimentPercentages.positive,
    trendData,
  ]);

  const handleClearFilters = () => {
    setPackageFilter("");
    setRatingFilter("");
    setStartDate("");
    setEndDate("");
    setSortBy("recent");
    setCurrentPage(1);
  };

  const isFilterActive =
    !!packageFilter ||
    !!ratingFilter ||
    !!startDate ||
    !!endDate ||
    sortBy !== "recent";

  const activeFilterCount =
    (packageFilter ? 1 : 0) +
    (ratingFilter ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (sortBy !== "recent" ? 1 : 0);

  function handleExport() {
    if (!ratings.length || typeof window === "undefined") return;

    const nowWita = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "full",
      timeStyle: "short",
    });

    const safeSummary = summary || {
      average_rating: 0,
      total_ratings: ratings.length,
      five_star_percentage: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      } as Record<number, number>,
    };

    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rowsHtml =
      ratings.length > 0
        ? ratings
            .map((rating, index) => {
              const rowClass = index % 2 === 0 ? "row-even" : "row-odd";
              const review = rating.review
                ? escapeHtml(
                    rating.review.length > 220
                      ? `${rating.review.slice(0, 220)}…`
                      : rating.review,
                  )
                : "Tidak ada ulasan tertulis.";

              return `
                <tr class="${rowClass}">
                  <td class="text-left">
                    <div class="order-id">${formatOrderNumber(rating.pesanan.id)}</div>
                    <div class="order-meta">${escapeHtml(
                      rating.pesanan.paket.name,
                    )}</div>
                  </td>
                  <td class="text-left">
                    <div class="user-name">${escapeHtml(
                      rating.pesanan.user.full_name,
                    )}</div>
                    <div class="user-email">${escapeHtml(
                      rating.pesanan.user.email,
                    )}</div>
                  </td>
                  <td>
                    <div class="rating-value">${rating.rating_value.toFixed(
                      1,
                    )}</div>
                    <div class="rating-stars">★★★★★</div>
                  </td>
                  <td>
                    <div class="date">${formatDateTimeWITA(
                      rating.created_at,
                    )}</div>
                  </td>
                  <td class="text-left">
                    <div class="review">${review}</div>
                  </td>
                </tr>
              `;
            })
            .join("")
        : `<tr><td colspan="5" class="text-left">Belum ada data rating untuk ditampilkan.</td></tr>`;

    const html = `
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Laporan Rating & Ulasan - LokaClean</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 24px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 12px;
              color: #020617;
              background-color: #f8fafc;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 6px;
            }
            .brand-logo-wrap {
              width: 30px;
              height: 30px;
              border-radius: 10px;
              overflow: hidden;
              background: #e5e7eb;
              box-shadow: 0 6px 12px rgba(15,23,42,0.25);
            }
            .brand-logo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .brand-title {
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #0f172a;
            }
            .brand-subtitle {
              margin-top: 2px;
              font-size: 10px;
              color: #64748b;
            }
            .title-block h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              letter-spacing: 0.03em;
              color: #020617;
            }
            .title-block p {
              margin: 4px 0 0;
              font-size: 11px;
              color: #64748b;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 10px;
              border-radius: 999px;
              background: linear-gradient(135deg, #0f172a, #020617);
              color: #e5e7eb;
              font-size: 10px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .meta {
              margin-bottom: 12px;
              font-size: 11px;
              color: #64748b;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 16px;
            }
            .summary-card {
              border-radius: 12px;
              padding: 10px 12px;
              background: radial-gradient(circle at top left, #f97316 0, #0f172a 46%, #020617 100%);
              color: #e5e7eb;
              position: relative;
              overflow: hidden;
            }
            .summary-card::after {
              content: "";
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at top right, rgba(251,191,36,0.12), transparent 60%);
              pointer-events: none;
            }
            .summary-label {
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.11em;
              opacity: 0.85;
            }
            .summary-value {
              margin-top: 6px;
              font-size: 14px;
              font-weight: 600;
            }
            .summary-sub {
              margin-top: 2px;
              font-size: 10px;
              opacity: 0.85;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            thead {
              background: #020617;
              color: #e5e7eb;
            }
            th, td {
              padding: 8px 10px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            th {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            td {
              font-size: 11px;
              color: #0f172a;
            }
            .row-even {
              background-color: #f9fafb;
            }
            .order-id {
              font-weight: 600;
            }
            .order-meta {
              margin-top: 2px;
              font-size: 10px;
              color: #64748b;
            }
            .user-name {
              font-weight: 500;
            }
            .user-email {
              margin-top: 2px;
              font-size: 10px;
              color: #64748b;
            }
            .rating-value {
              font-weight: 600;
              font-size: 13px;
            }
            .rating-stars {
              margin-top: 2px;
              font-size: 11px;
              letter-spacing: 1px;
              color: #fbbf24;
            }
            .date {
              font-size: 10px;
              color: #64748b;
            }
            .review {
              font-size: 11px;
              color: #0f172a;
            }
            .footer {
              margin-top: 18px;
              font-size: 10px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
            @page {
              margin: 18mm 14mm 18mm;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="title-block">
              <div class="brand">
                <div class="brand-logo-wrap">
                  <img src="/img/logo.jpg" alt="LokaClean Logo" class="brand-logo" />
                </div>
                <div>
                  <div class="brand-title">LOKACLEAN</div>
                  <div class="brand-subtitle">Dashboard Rating & Ulasan</div>
                </div>
              </div>
              <h1>Laporan Rating & Ulasan</h1>
              <p>LokaClean · Ringkasan kepuasan pelanggan berdasarkan ulasan</p>
            </div>
            <div class="badge">
              <span>RATING DASHBOARD</span>
            </div>
          </header>
          <div class="meta">
            Dibuat pada ${nowWita} (WITA)
          </div>
          <section class="summary">
            <div class="summary-card">
              <div class="summary-label">Rata-rata rating</div>
              <div class="summary-value">${safeSummary.average_rating.toFixed(
                2,
              )} / 5.00</div>
              <div class="summary-sub">Performa keseluruhan layanan</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total ulasan</div>
              <div class="summary-value">${safeSummary.total_ratings.toLocaleString(
                "id-ID",
              )}</div>
              <div class="summary-sub">Jumlah rating yang tercatat</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Porsi 5 bintang</div>
              <div class="summary-value">${safeSummary.five_star_percentage.toFixed(
                1,
              )}%</div>
              <div class="summary-sub">Kontribusi ulasan sangat puas</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Periode laporan</div>
              <div class="summary-value">${ratings.length.toLocaleString(
                "id-ID",
              )} entri</div>
              <div class="summary-sub">Sesuai filter aktif di halaman Rating</div>
            </div>
          </section>
          <table>
            <thead>
              <tr>
                <th>Pesanan</th>
                <th>Pelanggan</th>
                <th>Rating</th>
                <th>Tanggal</th>
                <th>Ringkasan ulasan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <span>LokaClean Admin · Panel Rating & Ulasan</span>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

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
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
                Rating & Ulasan
              </h1>
              {summary && (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  {summary.total_ratings.toLocaleString()} ulasan
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pantau kualitas layanan dan kepuasan pelanggan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Muat ulang</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!ratings.length}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Export laporan</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-200"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-full p-1 hover:bg-red-100/60 dark:hover:bg-red-800/40"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rata-rata Rating
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-50">
                {summary.average_rating.toFixed(2)}
              </div>
              <StarRating
                value={Math.round(summary.average_rating)}
                readOnly={true}
                size="sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Rating
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-50">
              {summary.total_ratings.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              5 Bintang
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-50">
                {summary.five_star_percentage.toFixed(1)}%
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                dari semua ulasan
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rating Bulan Ini
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-slate-50">
              {ratingsThisMonth.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Distribusi Rating
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total {summary.total_ratings.toLocaleString()} ulasan
              </span>
            </div>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((starValue) => {
                const count =
                  summary.distribution[
                    starValue as keyof typeof summary.distribution
                  ];
                const percentage =
                  summary.total_ratings > 0
                    ? (count / summary.total_ratings) * 100
                    : 0;

                return (
                  <div
                    key={starValue}
                    className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <div className="flex w-16 items-center justify-between">
                      <span className="font-medium">{starValue}</span>
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-3 rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="tabular-nums">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Insight AI Kualitas Layanan
                </h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Lihat Analisis Detail
              </button>
            </div>
            {insights.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum cukup data untuk menampilkan insight yang bermakna.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {insights.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Ringkasan Sentimen AI
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Berdasarkan ulasan yang tampil
            </span>
          </div>
          {ratings.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Belum ada ulasan untuk dianalisis.
            </p>
          ) : (
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
              {([
                {
                  key: "positive" as const,
                  label: "Sentimen Positif",
                  color: "bg-emerald-500",
                  bg: "bg-emerald-50 dark:bg-emerald-900/20",
                  value: sentimentPercentages.positive,
                  count: sentimentCounts.positive,
                },
                {
                  key: "neutral" as const,
                  label: "Sentimen Netral",
                  color: "bg-slate-400",
                  bg: "bg-slate-100 dark:bg-slate-800",
                  value: sentimentPercentages.neutral,
                  count: sentimentCounts.neutral,
                },
                {
                  key: "negative" as const,
                  label: "Sentimen Negatif",
                  color: "bg-rose-500",
                  bg: "bg-rose-50 dark:bg-rose-900/20",
                  value: sentimentPercentages.negative,
                  count: sentimentCounts.negative,
                },
              ] as const).map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      {item.value.toFixed(1)}% · {item.count} ulasan
                    </span>
                  </div>
                  <div className={`h-3 rounded-full ${item.bg}`}>
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Tren Rating Bulanan
            </h2>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {[3, 6, 12].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTrendRange(value as 3 | 6 | 12)}
                  className={`px-2.5 py-1 rounded-full ${
                    trendRange === value
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                      : "bg-transparent"
                  }`}
                >
                  {value} bln
                </button>
              ))}
            </div>
          </div>
          {trendLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Memuat tren rating...
            </div>
          ) : trendData.every((point) => point.totalRatings === 0) ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Belum ada data tren rating.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "#e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageRating"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, stroke: "#2563eb" }}
                      activeDot={{
                        r: 4,
                        strokeWidth: 1,
                        stroke: "#1d4ed8",
                        fill: "#ffffff",
                      }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid
                      stroke="#e5e7eb"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "#e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="totalRatings"
                      fill="#0f172a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter & Sort</span>
              {isFilterActive && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="hidden sm:block">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen((open) => !open)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-100"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter & Sort</span>
                {isFilterActive && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  isFilterPanelOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isFilterPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Paket
                      </label>
                      <select
                        title="Filter paket"
                        value={packageFilter}
                        onChange={(e) => setPackageFilter(e.target.value)}
                        disabled={packagesLoading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Semua paket</option>
                        {packagesLoading ? (
                          <option value="" disabled>
                            Memuat paket...
                          </option>
                        ) : packages.length > 0 ? (
                          packages.map((pkg) => (
                            <option
                              key={pkg.id}
                              value={pkg.id.toString()}
                            >
                              {pkg.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            Tidak ada paket
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Rating
                      </label>
                      <select
                        title="Filter rating"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Semua rating</option>
                        {[5, 4, 3, 2, 1].map((val) => (
                          <option key={val} value={val}>
                            {val} bintang
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Tanggal mulai
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Tanggal akhir
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="min-w-[200px] flex-1 space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Urutkan
                      </label>
                      <select
                        title="Opsi urutan"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(
                            e.target.value as "highest" | "lowest" | "recent",
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="recent">Terbaru</option>
                        <option value="highest">Rating tertinggi</option>
                        <option value="lowest">Rating terendah</option>
                      </select>
                    </div>
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <X className="h-3 w-3" />
                        <span>Reset filter</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/40 sm:hidden">
          <div className="mt-auto rounded-t-2xl bg-white p-4 pb-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Filter & Sort
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Paket
                </label>
                <select
                  title="Filter paket"
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  disabled={packagesLoading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Semua paket</option>
                  {packagesLoading ? (
                    <option value="" disabled>
                      Memuat paket...
                    </option>
                  ) : packages.length > 0 ? (
                    packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id.toString()}>
                        {pkg.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Tidak ada paket
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Rating
                </label>
                <select
                  title="Filter rating"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Semua rating</option>
                  {[5, 4, 3, 2, 1].map((val) => (
                    <option key={val} value={val}>
                      {val} bintang
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tanggal mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tanggal akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Urutkan
                </label>
                <select
                  title="Opsi urutan"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "highest" | "lowest" | "recent",
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="recent">Terbaru</option>
                  <option value="highest">Rating tertinggi</option>
                  <option value="lowest">Rating terendah</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Daftar Ulasan
            </h2>
            {pagination && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {pagination.total.toLocaleString()} ulasan
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"
              />
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Star className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              Belum ada rating yang masuk.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Rating baru akan muncul di sini setelah pelanggan memberikan
              penilaian.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {rating.pesanan.user.full_name}
                        </span>
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          {rating.pesanan.paket.name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                            getSentiment(rating) === "positive"
                              ? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:bg-emerald-900/20"
                              : getSentiment(rating) === "neutral"
                              ? "border-slate-300 text-slate-600 bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-800"
                              : "border-rose-500 text-rose-600 bg-rose-50 dark:border-rose-400 dark:text-rose-200 dark:bg-rose-900/10"
                          }`}
                        >
                          {getSentiment(rating) === "positive"
                            ? "Sentimen: Positif"
                            : getSentiment(rating) === "neutral"
                            ? "Sentimen: Netral"
                            : "Sentimen: Negatif"}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {rating.pesanan.user.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>{rating.rating_value.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {formatDateTimeWITA(rating.created_at)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ID Pesanan {formatOrderNumber(rating.pesanan.id)}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-slate-700 line-clamp-3 dark:text-slate-200">
                    {rating.review
                      ? rating.review
                      : "Tidak ada ulasan tertulis dari pelanggan ini."}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `mailto:${rating.pesanan.user.email}`,
                          "_blank",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      Balas
                    </button>
                    <Link
                      to={`/admin/orders/${rating.pesanan.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Lihat detail
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm sm:flex-row dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <div className="text-center sm:text-left">
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  sampai{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {pagination.total}
                  </span>{" "}
                  ulasan
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={!pagination.hasPrev}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Sebelumnya
                  </button>
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages, p + 1),
                      )
                    }
                    disabled={!pagination.hasNext}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

