import { useState, useEffect } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { PWAInstallModal } from "./PWAInstallModal";
import { PWAInstallToast } from "./PWAInstallToast";
import { Download, X, Sparkles } from "lucide-react";

export function PWAInstallPrompt() {
  const { 
    canInstall, 
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
  } = usePWAInstall();

  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check session storage for bottom banner dismissal
    const dismissed = sessionStorage.getItem("pwa_banner_dismissed") === "true";
    if (dismissed) setBannerDismissed(true);
  }, []);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  return (
    <>
      {/* Optional Unobtrusive Floating Mobile Bottom Banner */}
      {!isInstalled && !bannerDismissed && (isAndroid || isIOS) && (
        <div className="fixed bottom-5 left-4 right-4 md:hidden z-40 animate-fade-in">
          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex items-center gap-3 pt-0.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xs text-white tracking-tight">Install AutoApply AI</h3>
                <p className="text-[11px] text-slate-300 truncate">
                  Add to home screen for 1-tap app experience.
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={openModal}
                  className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install</span>
                </button>

                <button
                  onClick={handleDismissBanner}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified PWA Install Modal */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={closeModal}
        canInstall={canInstall}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isDesktop={isDesktop}
        browserName={browserName}
        onPromptInstall={promptInstall}
      />

      {/* Installation Success Toast */}
      <PWAInstallToast
        message={toastMessage}
        onClose={closeToast}
      />
    </>
  );
}
