import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface PWAInstallToastProps {
  message: string | null;
  onClose: () => void;
}

export function PWAInstallToast({ message, onClose }: PWAInstallToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm w-full px-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 p-4 bg-slate-900/95 dark:bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
        
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 ml-1">
          <CheckCircle2 className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
            Success
          </p>
          <p className="text-xs text-slate-100 font-medium leading-tight">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
