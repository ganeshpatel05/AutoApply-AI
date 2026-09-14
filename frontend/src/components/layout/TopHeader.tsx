import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Sun, Moon, Menu, Sparkles, AlertCircle, Download } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { api } from "../../api/client";
import type { SystemStatus } from "../../types";

interface TopHeaderProps {
  onToggleMobile?: () => void;
}

export function TopHeader({ onToggleMobile }: TopHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isInstalled, promptInstall } = usePWAInstall();
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get<{ success: boolean; system: SystemStatus }>("/api/system/status");
        if (res.success) setSystemStatus(res.system);
      } catch {
        // silent fallback
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch(location.pathname) {
      case "/": return "Dashboard Command Center";
      case "/jobs": return "Job Marketplace & Discovery";
      case "/resume": return "Resume Intelligence";
      case "/matcher": return "Resume ↔ JD Matcher";
      case "/cover-letters": return "AI Cover Letter Studio";
      case "/applications": return "Application Pipeline Tracker";
      case "/agents": return "Multi-Agent Command Center";
      case "/analytics": return "Career Analytics & Metrics";
      case "/profile": return "Candidate Profile";
      case "/settings": return "Settings";
      default: return "AutoApply AI";
    }
  };

  const isOllamaConnected = systemStatus?.ollama?.status === "connected";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[var(--bg-secondary)]/85 backdrop-blur-md border-b border-[var(--border-color)] sticky top-0 z-30 transition-all duration-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobile}
          className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">{getPageTitle()}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* PWA Install Action Button */}
        {!isInstalled && (
          <button
            onClick={() => promptInstall()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Install AutoApply AI App on Android / Device"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* System / AI Status Indicator Pill */}
        <Link 
          to="/settings"
          className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isOllamaConnected 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-xs"
              : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-xs"
          }`}
          title={isOllamaConnected ? `Ollama connected (${systemStatus?.ollama?.active_model || 'Local Model'})` : "Ollama offline - Rule-based fallback active"}
        >
          {isOllamaConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Connected ({systemStatus?.ollama?.active_model || 'Ollama'})</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ollama Offline (Fallback Mode)</span>
            </>
          )}
        </Link>

        <button 
          onClick={toggleTheme}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all p-2 rounded-xl hover:bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-color)] active:scale-90"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <Link to="/profile" className="flex items-center gap-2 pl-1 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-xs group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
              <span className="text-xs font-extrabold text-[var(--text-primary)]">AI</span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

