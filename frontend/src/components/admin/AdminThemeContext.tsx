import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { api } from "../../lib/api";

type ThemeMode = "light" | "dark";
type ThemePreference = "manual" | "system" | "scheduled" | "smart";

type AccentPreset = "blue" | "emerald" | "purple" | "orange" | "slate" | "custom";

type AccentSettings = {
  preset: AccentPreset;
  customColor?: string;
};

type ScheduleSettings = {
  darkStart: string;
  lightStart: string;
};

type SmartSettings = {
  enabled: boolean;
};

export type AdminThemeSettings = {
  mode: ThemeMode;
  preference: ThemePreference;
  accent: AccentSettings;
  schedule: ScheduleSettings;
  smart: SmartSettings;
  overrideUntil?: string | null;
  overrideMode?: ThemeMode | null;
};

type AdminThemeContextValue = {
  settings: AdminThemeSettings;
  effectiveMode: ThemeMode;
  loading: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggleManualMode: () => void;
  setSchedule: (schedule: Partial<ScheduleSettings>) => void;
  setAccentPreset: (preset: Exclude<AccentPreset, "custom">) => void;
  setCustomAccent: (color: string) => void;
  enableSmartMode: (preferredMode: ThemeMode) => void;
};

const defaultSettings: AdminThemeSettings = {
  mode: "light",
  preference: "system",
  accent: {
    preset: "blue"
  },
  schedule: {
    darkStart: "18:00",
    lightStart: "06:00"
  },
  smart: {
    enabled: false
  },
  overrideUntil: null,
  overrideMode: null
};

const STORAGE_KEY = "lokaclean_admin_theme_settings";

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

type AccentPalette = {
  primary: string;
  hover: string;
  soft: string;
};

function normalizeHex(hex: string): string {
  let value = hex.trim();
  if (!value.startsWith("#")) value = `#${value}`;
  if (value.length === 4) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    value = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (value.length !== 7) {
    return "#2563eb";
  }
  return value.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = normalizeHex(hex).slice(1);
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function adjustLightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = clamp(Math.round(r + (factor * 255)), 0, 255);
  const ng = clamp(Math.round(g + (factor * 255)), 0, 255);
  const nb = clamp(Math.round(b + (factor * 255)), 0, 255);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function toRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPresetColor(preset: Exclude<AccentPreset, "custom">): string {
  if (preset === "emerald") return "#10b981";
  if (preset === "purple") return "#8b5cf6";
  if (preset === "orange") return "#f97316";
  if (preset === "slate") return "#64748b";
  return "#2563eb";
}

function buildPalette(baseColor: string, mode: ThemeMode): AccentPalette {
  const normalized = normalizeHex(baseColor);
  if (mode === "dark") {
    const base = adjustLightness(normalized, 0.1);
    const hover = adjustLightness(normalized, 0.2);
    const soft = toRgba(normalized, 0.24);
    return { primary: base, hover, soft };
  }
  const base = normalized;
  const hover = adjustLightness(normalized, -0.12);
  const soft = toRgba(normalized, 0.08);
  return { primary: base, hover, soft };
}

function parseTimeToMinutes(value: string): number {
  const parts = value.split(":");
  if (parts.length !== 2) return 0;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function isDarkScheduled(now: Date, schedule: ScheduleSettings): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const darkStart = parseTimeToMinutes(schedule.darkStart);
  const lightStart = parseTimeToMinutes(schedule.lightStart);
  if (darkStart === lightStart) return false;
  if (darkStart < lightStart) {
    return minutes >= darkStart && minutes < lightStart;
  }
  return minutes >= darkStart || minutes < lightStart;
}

function computeEffectiveMode(settings: AdminThemeSettings, systemPrefersDark: boolean, now: Date): ThemeMode {
  if (settings.preference === "scheduled" && settings.overrideMode && settings.overrideUntil) {
    const until = new Date(settings.overrideUntil);
    if (until.getTime() > now.getTime()) {
      return settings.overrideMode;
    }
  }
  if (settings.preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  if (settings.preference === "scheduled") {
    return isDarkScheduled(now, settings.schedule) ? "dark" : "light";
  }
  if (settings.preference === "smart") {
    if (settings.smart.enabled) {
      const night = now.getHours() >= 18 || now.getHours() < 6;
      if (night) return "dark";
      return "light";
    }
    return systemPrefersDark ? "dark" : "light";
  }
  return settings.mode;
}

function applyTheme(mode: ThemeMode, palette: AccentPalette) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
  root.style.setProperty("--color-primary", palette.primary);
  root.style.setProperty("--color-primary-hover", palette.hover);
  root.style.setProperty("--color-primary-soft", palette.soft);
}

export function AdminThemeProvider({ children }: Props) {
  const [settings, setSettings] = useState<AdminThemeSettings>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AdminThemeSettings;
        return { ...defaultSettings, ...parsed };
      }
    } catch {
      void 0;
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState(false);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current = mql;
    const listener = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    mql.addEventListener("change", listener);
    return () => {
      mql.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const resp = await api.get("/admin/me/theme");
        const remote = resp.data?.data?.settings as AdminThemeSettings | null | undefined;
        if (!cancelled && remote) {
          setSettings(prev => ({ ...prev, ...remote }));
        }
      } catch {
        void 0;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveMode = useMemo(() => {
    return computeEffectiveMode(settings, systemPrefersDark, new Date());
  }, [settings, systemPrefersDark]);

  useEffect(() => {
    const baseColor =
      settings.accent.preset === "custom" && settings.accent.customColor
        ? settings.accent.customColor
        : getPresetColor(settings.accent.preset === "custom" ? "blue" : settings.accent.preset);
    const palette = buildPalette(baseColor, effectiveMode);
    applyTheme(effectiveMode, palette);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      void 0;
    }
  }, [settings, effectiveMode]);

  useEffect(() => {
    if (settings.preference !== "scheduled") return;
    const now = new Date();
    const darkNow = isDarkScheduled(now, settings.schedule);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const darkStart = parseTimeToMinutes(settings.schedule.darkStart);
    const lightStart = parseTimeToMinutes(settings.schedule.lightStart);
    let targetMinutes: number;
    if (darkNow) {
      targetMinutes = lightStart;
    } else {
      targetMinutes = darkStart;
    }
    let diff = targetMinutes - currentMinutes;
    if (diff <= 0) diff += 24 * 60;
    const timeoutMs = diff * 60 * 1000;
    const id = setTimeout(() => {
      setSettings(prev => ({ ...prev }));
    }, timeoutMs);
    return () => {
      clearTimeout(id);
    };
  }, [settings.preference, settings.schedule.darkStart, settings.schedule.lightStart]);

  const persistSettings = useCallback(async (next: AdminThemeSettings) => {
    setSettings(next);
    try {
      await api.put("/admin/me/theme", { settings: next });
    } catch {
      void 0;
    }
  }, []);

  const setPreference = useCallback(
    (preference: ThemePreference) => {
      const next: AdminThemeSettings = { ...settings, preference };
      if (preference === "manual") {
        next.mode = effectiveMode;
        next.overrideMode = null;
        next.overrideUntil = null;
      }
      if (preference === "system") {
        next.mode = systemPrefersDark ? "dark" : "light";
      }
      if (preference === "scheduled") {
        const darkNow = isDarkScheduled(new Date(), next.schedule);
        next.mode = darkNow ? "dark" : "light";
        next.overrideMode = null;
        next.overrideUntil = null;
      }
      if (preference === "smart") {
        next.smart = { ...next.smart, enabled: true };
      }
      persistSettings(next);
    },
    [settings, effectiveMode, systemPrefersDark, persistSettings]
  );

  const toggleManualMode = useCallback(() => {
    const now = new Date();
    if (settings.preference === "scheduled") {
      const currentMode = computeEffectiveMode(settings, systemPrefersDark, now);
      const nextMode: ThemeMode = currentMode === "dark" ? "light" : "dark";
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const darkStart = parseTimeToMinutes(settings.schedule.darkStart);
      const lightStart = parseTimeToMinutes(settings.schedule.lightStart);
      const darkNow = isDarkScheduled(now, settings.schedule);
      let targetMinutes: number;
      if (darkNow) {
        targetMinutes = lightStart;
      } else {
        targetMinutes = darkStart;
      }
      let diff = targetMinutes - currentMinutes;
      if (diff <= 0) diff += 24 * 60;
      const target = new Date(now.getTime() + diff * 60 * 1000);
      const next: AdminThemeSettings = {
        ...settings,
        mode: nextMode,
        overrideMode: nextMode,
        overrideUntil: target.toISOString()
      };
      persistSettings(next);
      return;
    }
    const nextMode: ThemeMode = effectiveMode === "dark" ? "light" : "dark";
    const next: AdminThemeSettings = {
      ...settings,
      preference: "manual",
      mode: nextMode,
      overrideMode: null,
      overrideUntil: null
    };
    persistSettings(next);
  }, [settings, effectiveMode, systemPrefersDark, persistSettings]);

  const setSchedule = useCallback(
    (schedule: Partial<ScheduleSettings>) => {
      const nextSchedule: ScheduleSettings = { ...settings.schedule, ...schedule };
      const next: AdminThemeSettings = { ...settings, schedule: nextSchedule };
      if (next.preference === "scheduled") {
        const darkNow = isDarkScheduled(new Date(), nextSchedule);
        next.mode = darkNow ? "dark" : "light";
      }
      persistSettings(next);
    },
    [settings, persistSettings]
  );

  const setAccentPreset = useCallback(
    (preset: Exclude<AccentPreset, "custom">) => {
      const next: AdminThemeSettings = {
        ...settings,
        accent: {
          preset,
          customColor: settings.accent.customColor
        }
      };
      persistSettings(next);
    },
    [settings, persistSettings]
  );

  const setCustomAccent = useCallback(
    (color: string) => {
      const normalized = normalizeHex(color);
      const next: AdminThemeSettings = {
        ...settings,
        accent: {
          preset: "custom",
          customColor: normalized
        }
      };
      persistSettings(next);
    },
    [settings, persistSettings]
  );

  const enableSmartMode = useCallback(
    (preferredMode: ThemeMode) => {
      const next: AdminThemeSettings = {
        ...settings,
        smart: { enabled: true },
        preference: "smart",
        mode: preferredMode
      };
      persistSettings(next);
    },
    [settings, persistSettings]
  );

  const value: AdminThemeContextValue = {
    settings,
    effectiveMode,
    loading,
    setPreference,
    toggleManualMode,
    setSchedule,
    setAccentPreset,
    setCustomAccent,
    enableSmartMode
  };

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return ctx;
}
