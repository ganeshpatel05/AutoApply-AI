import { useState, useEffect } from "react";
import { WifiOff, Wifi, X } from "lucide-react";

export function OfflineNotifier() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowNotification(true);
        const timer = setTimeout(() => setShowNotification(false), 4000);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (!showNotification && isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-bounce-in">
      <div
        className={`flex items-center gap-3 p-3.5 rounded-xl shadow-xl border text-sm font-medium backdrop-blur-md transition-all ${
          isOnline
            ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
            : "bg-amber-950/95 text-amber-200 border-amber-500/40"
        }`}
      >
        <div
          className={`p-2 rounded-lg ${
            isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs uppercase tracking-wider">
            {isOnline ? "Connection Restored" : "Offline Mode Active"}
          </p>
          <p className="text-xs opacity-90 truncate">
            {isOnline
              ? "Back online. Syncing career features."
              : "Using cached app shell and saved data."}
          </p>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="p-1 rounded-md hover:bg-white/10 opacity-75 hover:opacity-100 transition-opacity"
          aria-label="Dismiss offline banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
