/**
 * Midtrans Snap.js integration utilities.
 * 
 * SANDBOX ONLY - This integration uses Midtrans Sandbox environment.
 * Production keys are not supported in this implementation.
 */

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

/**
 * Load Midtrans Snap.js script dynamically.
 * Uses SANDBOX environment only (https://app.sandbox.midtrans.com/snap/snap.js)
 */
export function loadMidtransSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.snap) {
      resolve();
      return;
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error("VITE_MIDTRANS_CLIENT_KEY is not configured"));
      return;
    }

    // Verify sandbox key format.
    // Midtrans currently issues sandbox keys with either:
    // - "SB-Mid-client-..." (older format)
    // - "Mid-client-..." (newer format)
    const isSandboxKey =
      clientKey.startsWith("SB-Mid-client-") ||
      clientKey.startsWith("Mid-client-");

    if (!isSandboxKey) {
      console.error(
        "[Midtrans] Invalid client key format. Expected sandbox key starting with 'SB-Mid-client-' or 'Mid-client-'"
      );
      reject(
        new Error(
          "Invalid Midtrans client key format. Only sandbox client keys are supported."
        )
      );
      return;
    }

    // Check if script element already exists
    const existingScript = document.getElementById("midtrans-snap-script");
    if (existingScript) {
      // If script exists but window.snap is still undefined, assume stale/failed load
      // and remove it so we can re-create a fresh script tag.
      existingScript.remove();
    }

    // Create and load script
    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.type = "text/javascript";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);

    script.onload = () => {
      if (window.snap) {
        resolve();
      } else {
        reject(new Error("Midtrans Snap.js script loaded but window.snap is not available"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap.js script"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize payment with Midtrans Snap.
 * 
 * @param snapToken - Token received from backend POST /api/payments/snap-token
 * @param callbacks - Callback functions for payment events
 */
export async function initializeSnapPayment(
  snapToken: string,
  callbacks: {
    onSuccess?: (result: unknown) => void;
    onPending?: (result: unknown) => void;
    onError?: (result: unknown) => void;
    onClose?: () => void;
  }
): Promise<void> {
  // Ensure script is loaded
  await loadMidtransSnapScript();

  if (!window.snap) {
    throw new Error("Midtrans Snap.js is not available");
  }

  // Open payment popup
  window.snap.pay(snapToken, {
    onSuccess: callbacks.onSuccess,
    onPending: callbacks.onPending,
    onError: callbacks.onError,
    onClose: callbacks.onClose
  });
}

