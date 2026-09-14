import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { PWAInstallPrompt } from "../pwa/PWAInstallPrompt";
import { OfflineNotifier } from "../pwa/OfflineNotifier";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* PWA Features & Offline Status Notifier */}
      <PWAInstallPrompt />
      <OfflineNotifier />
    </div>
  );
}

