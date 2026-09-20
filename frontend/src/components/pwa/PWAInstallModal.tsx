import { useEffect, useState } from "react";
import { 
  Sparkles, 
  Download, 
  X, 
  Check, 
  Share, 
  MoreVertical, 
  PlusSquare, 
  Monitor, 
  Smartphone, 
  CheckCircle2, 
  Info 
} from "lucide-react";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  browserName: string;
  onPromptInstall: () => Promise<boolean>;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  canInstall,
  isInstalled,
  isIOS,
  isAndroid,
  isDesktop,
  browserName,
  onPromptInstall
}: PWAInstallModalProps) {
  const [installing, setInstalling] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await onPromptInstall();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-3xl shadow-2xl overflow-hidden z-10 transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Top Header Banner Accent */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* App Branding & Icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[var(--bg-secondary)] rounded-[14px] flex items-center justify-center overflow-hidden">
                  <img 
                    src="/pwa-192x192.png" 
                    alt="AutoApply AI Icon" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Sparkles className="w-8 h-8 text-indigo-500 hidden group-has-[img[style*='display: none']]:block" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--bg-secondary)] flex items-center justify-center text-white">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 id="pwa-install-title" className="text-xl font-extrabold tracking-tight">
                  {isInstalled ? "AutoApply AI App" : "Install AutoApply AI"}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  PWA App
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Career Command Center & AI Job Assistant
              </p>
            </div>
          </div>

          {/* Conditional Content based on PWA Installation Status */}

          {/* STATE: ALREADY INSTALLED */}
          {isInstalled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Application Already Installed!
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    AutoApply AI is running as an installed standalone app or is already saved to your home screen/desktop launcher.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2 text-xs text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">Features Enabled:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Standalone App Window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Cached App Shell Offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Fast 1-Tap Home Launcher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>No URL Bar Distractions</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : canInstall ? (
            /* STATE: NATIVE INSTALL AVAILABLE */
            <div className="space-y-5">
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                Install AutoApply AI on your device for faster access and an app-like experience without browser navigation bars.
              </p>

              {/* Benefits Checklist */}
              <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-primary)]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Quick access from your home screen or desktop</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-primary)]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Faster app-like experience & instant launch</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-primary)]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Works with supported offline shell features</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-primary)]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>No browser tabs or address bar required</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{installing ? "Opening Prompt..." : "Install AutoApply AI"}</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-semibold text-xs border border-[var(--border-color)] transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ) : (
            /* STATE: NATIVE INSTALL UNAVAILABLE (SHOW MANUAL INSTRUCTIONS) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Your browser (<strong>{browserName}</strong>) doesn't currently provide an automatic 1-click install button. You can add AutoApply AI manually in seconds:
                </p>
              </div>

              {/* Benefits Checklist */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Quick access from home screen & offline app shell capability</span>
                </div>
              </div>

              {/* Platform-Specific Step-by-Step Instructions */}
              {isIOS ? (
                /* iOS Instructions */
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>iOS Safari Instructions</span>
                  </div>

                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <p>
                        Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> <strong>Share</strong> button in Safari's bottom toolbar.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <p>
                        Scroll down and select <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> <strong>Add to Home Screen</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <p>
                        Tap <strong>Add</strong> in the top right corner to create your app icon!
                      </p>
                    </div>
                  </div>
                </div>
              ) : isAndroid ? (
                /* Android Instructions */
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>Android ({browserName}) Instructions</span>
                  </div>

                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <p>
                        Tap the <MoreVertical className="w-3.5 h-3.5 inline text-indigo-400" /> <strong>Browser Menu</strong> (3 dots at top-right).
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <p>
                        Select <Download className="w-3.5 h-3.5 inline text-emerald-400" /> <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <p>
                        Confirm prompt to launch AutoApply AI as a standalone mobile app.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Instructions */
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    <Monitor className="w-4 h-4" />
                    <span>Desktop ({isDesktop ? browserName : 'Browser'}) Instructions</span>
                  </div>

                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <p>
                        Look for the <Download className="w-3.5 h-3.5 inline text-indigo-400" /> <strong>Install icon</strong> in your browser address bar (URL bar).
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <p>
                        Or click browser menu (<MoreVertical className="w-3.5 h-3.5 inline text-indigo-400" />) → <strong>Install AutoApply AI...</strong>
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                      <p>
                        Click <strong>Install</strong> to open AutoApply AI in its own desktop window!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
