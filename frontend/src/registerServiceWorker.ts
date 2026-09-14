export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = "/sw.js";

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("[PWA] Service Worker registered successfully with scope:", registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("[PWA] New content is available; please refresh.");
                window.dispatchEvent(new CustomEvent("pwa-update-available"));
              } else {
                console.log("[PWA] Content is cached for offline use.");
                window.dispatchEvent(new CustomEvent("pwa-offline-ready"));
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });
  });
}
