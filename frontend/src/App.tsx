/**
 * Root application component.
 */

import { useState, useEffect } from "react";
import { AuthProvider } from "./lib/auth";
import { AppRoutes } from "./routes";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { UserProvider } from "./components/UserGlobalData";

export function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if PWA (Standalone) or Mobile App Wrapper
    // This ensures the splash screen only shows for installed/standalone usage as requested
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) {
      setShowSplash(true);
    }
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        {showSplash && <WelcomeScreen onComplete={() => setShowSplash(false)} />}
        <AppRoutes />
      </UserProvider>
    </AuthProvider>
  );
}
