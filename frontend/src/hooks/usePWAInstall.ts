import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../utils/analytics";

export type InstallPlatform = "android-chrome" | "ios-safari" | "android-other" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function getPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";

  const win = window as Window & { MSStream?: unknown };
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !win.MSStream;
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Edg|Chrome/.test(ua);

  if (isIOS) return "ios-safari";
  if (isAndroid) {
    if (isChrome) return "android-chrome";
    return "android-other"; // Google App, Firefox, Samsung Internet, etc.
  }
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
  const [userDismissed, setUserDismissed] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isStandaloneDisplay();
  });

  const platform = useMemo(() => getPlatform(), []);

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
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismissedRecently = userDismissed;

  // More permissive installable check:
  // 1. If we have a prompt (Chrome/Edge/Samsung), it's installable.
  // 2. If we are on Android (any browser) and not standalone, it's installable (manual or auto).
  // 3. iOS is handled separately usually, but we can include it here if we want a banner too.
  const isInstallable =
    !installed &&
    !dismissedRecently &&
    (!!deferredPrompt || platform === "android-chrome" || platform === "android-other");

  useEffect(() => {
    if (isInstallable && !bannerVisible && !userDismissed) {
      setBannerVisible(true);
      trackEvent("install_banner_shown");
    }
  }, [isInstallable, bannerVisible, userDismissed]);

  const requestInstall = async () => {
    if (!deferredPrompt) {
      // If no prompt event, but we are on a supported mobile platform, show manual instructions
      if (platform === "android-chrome" || platform === "android-other") {
         setShowManualInstructions(true);
         trackEvent("install_manual_instructions_shown");
      } else if (isStandaloneDisplay()) {
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
    setUserDismissed(true);
    trackEvent("install_dismissed");
  };

  const closeManualInstructions = () => {
    setShowManualInstructions(false);
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
    showManualInstructions,
    closeManualInstructions
  };
}
