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
      "w-56 flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-300 z-40",
      "fixed md:static inset-y-0 left-0",
      mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
        <Link to="/" className="flex items-center gap-2 group" onClick={onCloseMobile}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent tracking-tight">
              AutoApply AI
            </span>
            <span className="block text-[9px] tracking-wider text-[var(--text-muted)] uppercase font-bold">
              Career Command
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {section.title}
            </h3>
            <nav className="space-y-0.5">
              {section.links.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group relative",
                      isActive 
                        ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400"></span>
                    )}
                    <item.icon className={cn(
                      "w-3.5 h-3.5 transition-transform group-hover:scale-110",
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
      <div className="p-2.5 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/40">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/5 border border-indigo-500/20 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-[11px] text-[var(--text-primary)]">Android & Mobile</span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] leading-tight mb-2">
            Install AutoApply AI on home screen.
          </p>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-98"
          >
            <span>📱 Install Mobile App</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

