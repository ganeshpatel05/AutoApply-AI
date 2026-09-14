import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running as installed PWA (Standalone mode)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(Boolean(isStandaloneMedia || isIOSStandalone));
    };

    checkStandalone();

    // Detect iOS browser
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[PWA] App successfully installed on device!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted the install prompt");
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log("[PWA] User dismissed the install prompt");
        return false;
      }
    } catch (err) {
      console.error("[PWA] Error prompting installation:", err);
      return false;
    }
  };

  return {
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    isIOS,
    promptInstall
  };
}
