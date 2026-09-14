import { useState, useEffect } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Smartphone, Download, X, Sparkles, Share, MoreVertical, PlusSquare } from "lucide-react";

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt during this session
    const isDismissed = sessionStorage.getItem("pwa_prompt_dismissed") === "true";
    if (isDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        setDismissed(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating Banner Prompt for Android / Mobile browsers */}
      {!dismissed && (
        <div className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 animate-fade-in">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-xl relative overflow-hidden group">
            {/* Subtle animated gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            
            <div className="flex items-start gap-3.5 pt-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-bold text-sm text-white tracking-tight">Install AutoApply AI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Android App
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  Add to your home screen for quick 1-tap access, offline operation & native mobile feel.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{canInstall ? "Install Now" : "App Setup Guide"}</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Installation Guide Modal (For Android / iOS browsers) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-500 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Install AutoApply AI</h3>
                <p className="text-xs text-[var(--text-muted)]">Add to Home Screen on Android & iOS</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2">
                  iOS Safari Instructions:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs">
                    Tap the <Share className="w-4 h-4 inline mx-1 text-blue-400" /> <strong>Share</strong> button in Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs">
                    Scroll down and select <PlusSquare className="w-4 h-4 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-xs">
                    Tap <strong>Add</strong> in the top right to install the launcher icon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]">
                <p className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2">
                  Android Chrome / Edge / Brave Instructions:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs">
                    Tap the <MoreVertical className="w-4 h-4 inline mx-0.5 text-indigo-400" /> <strong>Browser Menu</strong> (3 dots top right).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs">
                    Select <Download className="w-4 h-4 inline mx-1 text-emerald-400" /> <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-xs">
                    Confirm prompt to launch AutoApply AI as a standalone app!
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
