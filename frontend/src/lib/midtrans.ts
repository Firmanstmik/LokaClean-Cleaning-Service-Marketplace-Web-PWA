/**
 * Midtrans Snap integration utilities.
 *
 * SECURITY NOTE:
 * ==============
 * Frontend callbacks (onSuccess, onPending, onError) are NOT trusted.
 * Payment status MUST be verified via backend API.
 * These callbacks are only for UX (showing loading states, redirects).
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

/**
 * Load Midtrans Snap.js script dynamically.
 * Uses sandbox URL by default, production URL if MIDTRANS_IS_PRODUCTION=true.
 */
export function loadMidtransSnap(clientKey: string, isProduction = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.snap) {
      resolve();
      return;
    }

    const scriptId = "midtrans-snap-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
    }

    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    script.src = baseUrl;
    script.setAttribute("data-client-key", clientKey);

    script.onload = () => {
      // Wait a bit for snap to initialize
      setTimeout(() => {
        if (window.snap) {
          resolve();
        } else {
          reject(new Error("Midtrans Snap failed to initialize"));
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap script"));
    };

    if (!document.getElementById(scriptId)) {
      document.body.appendChild(script);
    } else {
      resolve();
    }
  });
}

/**
 * Open Midtrans payment UI.
 *
 * IMPORTANT: Callbacks are for UX only. Always verify payment status via API.
 *
 * @param token - Snap token from backend
 * @param options - Callback functions (for UX only)
 */
export function openMidtransSnap(
  token: string,
  options: {
    onSuccess?: (result: unknown) => void;
    onPending?: (result: unknown) => void;
    onError?: (result: unknown) => void;
    onClose?: () => void;
  } = {}
): void {
  if (!window.snap) {
    throw new Error("Midtrans Snap is not loaded. Call loadMidtransSnap() first.");
  }

  window.snap.pay(token, {
    onSuccess: (result) => {
      console.log("[Midtrans] Payment success callback:", result);
      // NOTE: Don't trust this! Verify via API.
      options.onSuccess?.(result);
    },
    onPending: (result) => {
      console.log("[Midtrans] Payment pending callback:", result);
      // Payment is still pending, user needs to complete it
      options.onPending?.(result);
    },
    onError: (result) => {
      console.error("[Midtrans] Payment error callback:", result);
      options.onError?.(result);
    },
    onClose: () => {
      console.log("[Midtrans] Payment popup closed by user");
      options.onClose?.();
    }
  });
}

