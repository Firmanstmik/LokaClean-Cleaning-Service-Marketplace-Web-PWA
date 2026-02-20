import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../utils/analytics";

export type InstallPlatform = "android-chrome" | "ios-safari" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const PWA_INSTALLED_KEY = "lokaclean_pwa_installed";

function getPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";

  const win = window as Window & { MSStream?: unknown };
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !win.MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Edg/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);

  if (isIOS && isSafari) return "ios-safari";
  if (isAndroid && isChrome) return "android-chrome";
  if (!isAndroid && !isIOS) return "desktop";
  return "unknown";
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia("(display-mode: standalone)");
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return mql.matches || !!nav.standalone;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    if (isStandaloneDisplay()) return true;
    return window.localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  });

  const platform = useMemo(() => getPlatform(), []);

  useEffect(() => {
    if (installed) {
      window.localStorage.setItem(PWA_INSTALLED_KEY, "1");
    }
  }, [installed]);

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setInstalled(true);
      trackEvent("install_accepted");
      window.localStorage.setItem(PWA_INSTALLED_KEY, "1");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismissedRecently = false;

  const isInstallable =
    !!deferredPrompt && !installed && !dismissedRecently && platform === "android-chrome";

  useEffect(() => {
    if (isInstallable && !bannerVisible) {
      setBannerVisible(true);
      trackEvent("install_banner_shown");
    }
  }, [isInstallable, bannerVisible]);

  const requestInstall = async () => {
    if (!deferredPrompt) {
      if (isStandaloneDisplay()) {
        trackEvent("install_already_installed");
      }
      return;
    }
    trackEvent("install_clicked");
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      } else {
        trackEvent("install_dismissed");
      }
    } catch {
      trackEvent("install_dismissed");
    } finally {
      setBannerVisible(false);
    }
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    trackEvent("install_dismissed");
  };

  const shouldShowIosInstructions =
    platform === "ios-safari" && !installed && !dismissedRecently;

  if (installed && bannerVisible) {
    setBannerVisible(false);
  }

  return {
    platform,
    bannerVisible,
    setBannerVisible,
    isInstallable,
    installed,
    requestInstall,
    dismissBanner,
    shouldShowIosInstructions,
  };
}
