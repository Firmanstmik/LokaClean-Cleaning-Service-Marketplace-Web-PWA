/**
 * Root application component.
 */

import { useState, useEffect } from "react";
import { AuthProvider } from "./lib/auth";
import { AppRoutes } from "./routes";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { UserProvider } from "./components/UserGlobalData";

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function App() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const nav = window.navigator as NavigatorWithStandalone;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || !!nav.standalone;
    
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
