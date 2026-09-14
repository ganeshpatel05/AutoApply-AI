import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Target, 
  Mail, 
  CheckCircle,
  Bot,
  BarChart,
  User,
  Settings,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();

  const navigationSections = [
    {
      title: "Overview",
      links: [
        { name: "Dashboard", href: "/", icon: LayoutDashboard }
      ]
    },
    {
      title: "Workspace",
      links: [
        { name: "Jobs", href: "/jobs", icon: Briefcase },
        { name: "Resume", href: "/resume", icon: FileText },
        { name: "JD Matcher", href: "/matcher", icon: Target },
        { name: "Cover Letters", href: "/cover-letters", icon: Mail },
        { name: "Applications", href: "/applications", icon: CheckCircle }
      ]
    },
    {
      title: "AI Command",
      links: [
        { name: "AI Agents", href: "/agents", icon: Bot }
      ]
    },
    {
      title: "Insights",
      links: [
        { name: "Analytics", href: "/analytics", icon: BarChart }
      ]
    },
    {
      title: "Account",
      links: [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Settings", href: "/settings", icon: Settings }
      ]
    }
  ];

  return (
    <aside className={cn(
      "w-64 flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-300 z-40",
      "fixed md:static inset-y-0 left-0",
      mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              AutoApply AI
            </span>
            <span className="block text-[10px] tracking-wider text-[var(--text-muted)] uppercase font-semibold">
              Career Command
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.links.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                      isActive 
                        ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/25 shadow-xs" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:translate-x-0.5"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400"></span>
                    )}
                    <item.icon className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                    )} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* PWA Mobile App Install Widget in Sidebar */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/40">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/5 border border-indigo-500/20 text-xs shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-[var(--text-primary)]">Android & Mobile Ready</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mb-3">
            Install AutoApply AI on your mobile home screen for 1-tap app access.
          </p>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
            }}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <span>📱 Get Mobile App</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

