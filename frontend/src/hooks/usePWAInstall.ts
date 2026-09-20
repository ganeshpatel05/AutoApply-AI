import { useState, useEffect, useCallback } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const checkStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    const isOverlayMedia = window.matchMedia("(display-mode: window-controls-overlay)").matches;
    const isTWA = document.referrer.startsWith("android-app://");

    return Boolean(isStandaloneMedia || isIOSStandalone || isOverlayMedia || isTWA);
  }, []);

  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [browserName, setBrowserName] = useState<string>("Browser");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Detect environment & browser
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);
    setIsDesktop(!iosDevice && !androidDevice);

    if (userAgent.includes("edg/")) {
      setBrowserName("Edge");
    } else if (userAgent.includes("chrome") && !userAgent.includes("edg/")) {
      setBrowserName("Chrome");
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      setBrowserName("Safari");
    } else if (userAgent.includes("firefox")) {
      setBrowserName("Firefox");
    } else {
      setBrowserName("Browser");
    }

    // Listen for media display-mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
      setToastMessage("AutoApply AI installed successfully!");
      console.log("[PWA] App successfully installed on device!");
    };

    // Custom event to trigger PWA install modal from anywhere (e.g. sidebar)
    const handleTriggerInstall = () => {
      setIsModalOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const closeToast = useCallback(() => {
    setToastMessage(null);
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
        setIsModalOpen(false);
        setToastMessage("AutoApply AI installed successfully!");
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
    isAndroid,
    isDesktop,
    browserName,
    promptInstall,
    isModalOpen,
    openModal,
    closeModal,
    toastMessage,
    closeToast
  };
}
