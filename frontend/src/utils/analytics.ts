export function trackEvent(eventName: string, data?: Record<string, unknown>) {
  if (!eventName) return;
  const payload = data && Object.keys(data).length > 0 ? data : undefined;
  if (typeof window !== "undefined") {
    console.log("[Analytics]", eventName, payload ?? null);
  }
}
