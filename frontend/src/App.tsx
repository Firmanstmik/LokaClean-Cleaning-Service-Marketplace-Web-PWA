/**
 * Root application component.
 */

import { useState, useEffect } from "react";
import { AuthProvider } from "./lib/auth";
import { AppRoutes } from "./routes";
import { UserProvider } from "./components/UserGlobalData";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { usePushNotificationOnboarding } from "./hooks/usePushNotification";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PushOnboardingModal } from "./components/PushOnboardingModal";
import { IOSInstallPrompt } from "./components/IOSInstallPrompt";
import { SplashScreen } from "./components/SplashScreen";
import { StickyMobileCTA } from "./components/StickyMobileCTA";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const seen = window.sessionStorage.getItem("lokaclean_splash_seen_v1");
    return !seen;
  });

  useEffect(() => {
    if (!showSplash && typeof window !== "undefined") {
      window.sessionStorage.setItem("lokaclean_splash_seen_v1", "1");
    }
  }, [showSplash]);

  return (
    <AuthProvider>
      <UserProvider>
        <SplashScreen visible={showSplash} onFinished={() => setShowSplash(false)} />
        <PWAExperienceLayer />
        <div className="relative min-h-safe-screen">
          <AppRoutes />
          <StickyMobileCTA />
        </div>
      </UserProvider>
    </AuthProvider>
  );
}

function PWAExperienceLayer() {
  const [showInstallToast, setShowInstallToast] = useState(false);

  const {
    platform,
    bannerVisible,
    isInstallable,
    requestInstall,
    dismissBanner,
    shouldShowIosInstructions,
  } = usePWAInstall();

  const {
    showModal,
    processing,
    requestPermissionAndSubscribe,
    skipOnboarding,
  } = usePushNotificationOnboarding();

  useEffect(() => {
    const handler = () => {
      setShowInstallToast(true);
      setTimeout(() => setShowInstallToast(false), 3000);
    };
    window.addEventListener("appinstalled", handler);
    return () => {
      window.removeEventListener("appinstalled", handler);
    };
  }, []);

  return (
    <>
      <PWAInstallPrompt
        open={isInstallable && bannerVisible}
        platform={platform}
        onInstall={requestInstall}
        onDismiss={dismissBanner}
      />
      <PushOnboardingModal
        open={showModal}
        loading={processing}
        onEnable={requestPermissionAndSubscribe}
        onLater={skipOnboarding}
      />
      <IOSInstallPrompt
        isOpen={shouldShowIosInstructions}
        onClose={dismissBanner}
      />
      {showInstallToast && (
        <div className="fixed inset-x-0 bottom-16 z-[85] flex justify-center px-4">
          <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-slate-900/40">
            App berhasil diinstall 🎉
          </div>
        </div>
      )}
    </>
  );
}
