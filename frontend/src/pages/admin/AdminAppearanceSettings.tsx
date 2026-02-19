import { useMemo } from "react";
import { motion } from "framer-motion";
import { Palette, Moon, Sun, Clock, Sparkles } from "lucide-react";
import { useAdminTheme } from "../../components/admin/AdminThemeContext";

const accentPresets: { id: "blue" | "emerald" | "purple" | "orange" | "slate"; label: string; color: string }[] = [
  { id: "blue", label: "Blue", color: "#2563eb" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "purple", label: "Purple", color: "#8b5cf6" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "slate", label: "Slate", color: "#64748b" }
];

export function AdminAppearanceSettingsPage() {
  const { settings, effectiveMode, setPreference, setSchedule, setAccentPreset, setCustomAccent } = useAdminTheme();

  const nextDarkInfo = useMemo(() => {
    if (settings.preference !== "scheduled") return "";
    const now = new Date();
    const [h, m] = settings.schedule.darkStart.split(":").map(v => Number(v));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    const diffMs = target.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return "";
    if (diffHours === 1) return "Mode gelap aktif dalam 1 jam";
    return `Mode gelap aktif dalam ${diffHours} jam`;
  }, [settings.preference, settings.schedule.darkStart]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-50">
            Theme & Appearance
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Atur mode, jadwal, dan accent color dashboard admin agar sesuai preferensi kerja.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Advanced Theme Engine</span>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <motion.div
          layout
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Mode Theme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih cara sistem menentukan Light / Dark mode.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setPreference("manual")}
              className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm transition-colors ${
                settings.preference === "manual"
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-slate-900 dark:text-slate-50"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-semibold">Manual</span>
              <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Kendali penuh via toggle di header.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreference("system")}
              className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm transition-colors ${
                settings.preference === "system"
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-slate-900 dark:text-slate-50"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-semibold">Ikuti sistem</span>
              <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Sinkron dengan preferensi OS.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreference("scheduled")}
              className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left text-xs sm:text-sm transition-colors ${
                settings.preference === "scheduled"
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-slate-900 dark:text-slate-50"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span className="font-semibold">Otomatis (jadwal)</span>
              <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Dark di malam hari, Light di pagi.
              </span>
            </button>
          </div>

          {settings.preference === "scheduled" && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold">Jadwal otomatis</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Dark mode mulai
                  </span>
                  <input
                    type="time"
                    value={settings.schedule.darkStart}
                    onChange={e => setSchedule({ darkStart: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-primary-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Kembali ke Light
                  </span>
                  <input
                    type="time"
                    value={settings.schedule.lightStart}
                    onChange={e => setSchedule({ lightStart: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-primary-soft)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>
              {nextDarkInfo && (
                <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  {nextDarkInfo}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <div className="flex items-center gap-2">
              {effectiveMode === "dark" ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
              <span>
                Mode aktif saat ini{" "}
                <span className="font-semibold">
                  {effectiveMode === "dark" ? "Dark" : "Light"}
                </span>
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          layout
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Accent Color
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Warna utama untuk tombol, navigasi aktif, dan highlight.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {accentPresets.map(preset => {
                const isActive = settings.accent.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAccentPreset(preset.id)}
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-slate-900 dark:text-slate-50"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]">
                  <Palette className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="font-semibold">Custom color</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih warna hex sendiri untuk brand internal.
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input
                  type="color"
                  value={
                    settings.accent.preset === "custom" && settings.accent.customColor
                      ? settings.accent.customColor
                      : "#2563eb"
                  }
                  onChange={e => setCustomAccent(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-full border border-slate-300 bg-transparent p-0 dark:border-slate-600"
                />
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {settings.accent.preset === "custom" && settings.accent.customColor
                    ? settings.accent.customColor.toUpperCase()
                    : "Custom"}
                </span>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Accent color ini digunakan untuk tombol utama, link aktif, highlight badge, dan
              garis utama grafik sehingga dashboard terasa konsisten dan profesional.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

