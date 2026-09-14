import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { Monitor, Moon, Sun, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Server, Database, Mail } from "lucide-react";
import { cn } from "../utils/cn";
import { api } from "../api/client";
import type { SystemStatus } from "../types";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingModel, setSwitchingModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; system: SystemStatus }>("/api/system/status");
      if (res.success && res.system) {
        setSystemStatus(res.system);
        setSelectedModel(res.system.ollama.active_model || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const handleSwitchModel = async (newModel: string) => {
    if (!newModel) return;
    setSwitchingModel(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>("/api/system/ollama/switch", { model: newModel });
      if (res.success) {
        setSelectedModel(newModel);
        setToastMsg(res.message);
        setTimeout(() => setToastMsg(""), 3500);
        await loadSystemStatus();
      }
    } catch (err: any) {
      alert(err.message || "Failed to switch model");
    } fontally: {
      setSwitchingModel(false);
    }
  };

  const isOllamaConnected = systemStatus?.ollama?.status === "connected";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">System Settings</h2>
          <p className="text-xs text-[var(--text-secondary)]">Manage system preferences, theme, and AI engine status.</p>
        </div>
        <button
          onClick={loadSystemStatus}
          className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
          title="Refresh System Health"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Theme Selection Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Appearance Theme</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all text-xs font-semibold",
              theme === "light" 
                ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-2xs" 
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            <Sun className="w-6 h-6 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all text-xs font-semibold",
              theme === "dark" 
                ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-2xs" 
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            <Moon className="w-6 h-6 text-indigo-400" />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => {
              const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              setTheme(systemPrefersDark ? "dark" : "light");
            }}
            className="p-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] flex flex-col items-center gap-2.5 transition-all text-xs font-semibold"
          >
            <Monitor className="w-6 h-6 text-slate-500" />
            <span>System Default</span>
          </button>
        </div>
      </div>

      {/* Subsystem Health Dashboard */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Subsystem Health & Services</h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* API Status */}
          <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-[var(--text-primary)]">FastAPI Server</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold">Healthy</span>
          </div>

          {/* Database Status */}
          <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-violet-500" />
              <span className="font-semibold text-[var(--text-primary)]">SQLite DB</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-bold">Healthy</span>
          </div>

          {/* Ollama Status */}
          <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-[var(--text-primary)]">Ollama AI</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded font-bold border",
              isOllamaConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            )}>
              {isOllamaConnected ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Email Status */}
          <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-500" />
              <span className="font-semibold text-[var(--text-primary)]">SMTP Email</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded font-bold border",
              systemStatus?.email?.configured ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
            )}>
              {systemStatus?.email?.configured ? "Configured" : "Not Set"}
            </span>
          </div>
        </div>
      </div>

      {/* Ollama AI Engine Settings */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Ollama Local LLM Configuration
          </h3>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full font-bold border text-[11px]",
            isOllamaConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          )}>
            {isOllamaConnected ? "Connected" : "Offline / Rule Fallback Active"}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Ollama Base URL</label>
            <input 
              type="text" 
              value={systemStatus?.ollama?.base_url || "http://localhost:11434"}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] font-mono"
              disabled
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Active LLM Model</label>
            <div className="flex gap-2">
              <select 
                value={selectedModel}
                onChange={(e) => handleSwitchModel(e.target.value)}
                disabled={!isOllamaConnected || switchingModel}
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-medium"
              >
                {systemStatus?.ollama?.installed_models && systemStatus.ollama.installed_models.length > 0 ? (
                  systemStatus.ollama.installed_models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  <option value={selectedModel || "llama3"}>{selectedModel || "mistral (Default)"}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {!isOllamaConnected && (
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold block mb-0.5">Ollama Server Offline</span>
              To enable local LLM cover letter and resume generation, start Ollama locally (`ollama serve`) on port 11434. Until then, deterministic rule-based templates will be used seamlessly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
