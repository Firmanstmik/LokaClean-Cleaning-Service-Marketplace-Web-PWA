import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { trackEvent } from "../utils/analytics";

const PUSH_ONBOARDING_STATE_KEY = "lokaclean_push_onboarding_state";

type OnboardingState = "idle" | "completed" | "denied";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function loadState(): OnboardingState {
  if (typeof window === "undefined") return "idle";
  const raw = window.localStorage.getItem(PUSH_ONBOARDING_STATE_KEY);
  if (raw === "completed" || raw === "denied") return raw;
  return "idle";
}

export function usePushNotificationOnboarding() {
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [state, setState] = useState<OnboardingState>(() => loadState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PUSH_ONBOARDING_STATE_KEY, state);
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = () => {
      if (Notification.permission !== "default") return;
      if (loadState() !== "idle") return;
      setTimeout(() => {
        setShowModal(true);
      }, 2200);
    };

    window.addEventListener("appinstalled", handler);
    return () => {
      window.removeEventListener("appinstalled", handler);
    };
  }, []);

  const requestPermissionAndSubscribe = async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return;
    }
    trackEvent("push_permission_requested");
    setProcessing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        trackEvent("push_permission_denied");
        setState("denied");
        setShowModal(false);
        return;
      }
      trackEvent("push_permission_granted");

      if (!("serviceWorker" in navigator)) {
        setState("denied");
        setShowModal(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const publicKeyResponse = await api.get("/push/public-key");
      const publicKey =
        publicKeyResponse.data?.data?.publicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setState("denied");
        setShowModal(false);
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await api.post("/push/subscribe", subscription);

      trackEvent("welcome_notification_sent");
      setState("completed");
      setShowModal(false);
    } catch {
      setState("denied");
      setShowModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const skipOnboarding = () => {
    setShowModal(false);
  };

  return {
    showModal,
    processing,
    requestPermissionAndSubscribe,
    skipOnboarding,
  };
}

