import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardStats, Job, Application, Resume, ResumeScore, AgentLog } from "../types";
import { 
  Briefcase, 
  CheckCircle, 
  Target, 
  Users, 
  Play, 
  Upload, 
  Sparkles, 
  ArrowRight,
  Award,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [recentLogs, setRecentLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, resumeRes, jobsRes, appsRes, logsRes] = await Promise.allSettled([
        api.get<{ success: boolean; stats: DashboardStats }>("/api/analytics/"),
        api.get<{ success: boolean; resume: Resume }>("/api/resumes/active"),
        api.get<{ success: boolean; jobs: Job[] }>("/api/jobs/"),
        api.get<{ success: boolean; applications: Application[] }>("/api/applications/"),
        api.get<{ success: boolean; logs: AgentLog[] }>("/api/agents/logs")
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.success) {
        setStats(statsRes.value.stats || null);
      }
      if (resumeRes.status === "fulfilled" && resumeRes.value?.success) {
        setActiveResume(resumeRes.value.resume || null);
        try {
          const scoreRes = await api.get<{ success: boolean; score: ResumeScore }>("/api/resumes/active/score");
          if (scoreRes?.success) setResumeScore(scoreRes.score);
        } catch {
          // ignore
        }
      }
      if (jobsRes.status === "fulfilled" && jobsRes.value?.success && Array.isArray(jobsRes.value.jobs)) {
        setRecentJobs(jobsRes.value.jobs.slice(0, 4));
      }
      if (appsRes.status === "fulfilled" && appsRes.value?.success && Array.isArray(appsRes.value.applications)) {
        setRecentApps(appsRes.value.applications.slice(0, 4));
      }
      if (logsRes.status === "fulfilled" && logsRes.value?.success && Array.isArray(logsRes.value.logs)) {
        setRecentLogs(logsRes.value.logs.slice(0, 5));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const statCards = [
    { 
      name: "Jobs Found", 
      value: stats?.totalJobs || 0, 
      sub: "Discovered by Scout", 
      icon: Briefcase, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10 border-blue-500/20" 
    },
    { 
      name: "Applications", 
      value: stats?.applications || 0, 
      sub: `${stats?.appliedApps || 0} Sent`, 
      icon: CheckCircle, 
      color: "text-violet-500", 
      bg: "bg-violet-500/10 border-violet-500/20" 
    },
    { 
      name: "Interviews", 
      value: stats?.interviews || 0, 
      sub: `${stats?.offers || 0} Offers`, 
      icon: Users, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      name: "Resume Strength", 
      value: resumeScore ? `${resumeScore.total}%` : activeResume ? "Active" : "None", 
      sub: activeResume ? activeResume.name : "Upload Resume", 
      icon: Award, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10 border-amber-500/20" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-6 md:p-8 overflow-hidden shadow-lg text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Career Command Center</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">
            {activeResume ? `Welcome back, ${activeResume.name.split(' ')[0]}!` : "Welcome to AutoApply AI"}
          </h1>

          <p className="text-blue-100 text-sm md:text-base mb-6 leading-relaxed">
            {activeResume 
              ? `Your active resume profile is synced. You have ${stats?.totalJobs || 0} jobs discovered and ${stats?.applications || 0} applications tracked in your pipeline.`
              : "Upload your resume to activate multi-agent job discovery, ATS scoring, and personalized AI cover letter generation."}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!activeResume ? (
              <Link 
                to="/resume" 
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-all shadow-md hover:scale-102"
              >
                <Upload className="w-4 h-4" />
                Upload Resume First
              </Link>
            ) : (
              <>
                <Link 
                  to="/jobs" 
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-all shadow-md hover:scale-102"
                >
                  <Briefcase className="w-4 h-4" />
                  Explore Jobs ({stats?.totalJobs || 0})
                </Link>
                <Link 
                  to="/matcher" 
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold text-sm transition-all backdrop-blur-md border border-white/20"
                >
                  <Target className="w-4 h-4" />
                  Match JD
                </Link>
                <Link 
                  to="/agents" 
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold text-sm transition-all backdrop-blur-md border border-white/20"
                >
                  <Play className="w-4 h-4" />
                  Run Pipeline
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs hover:border-[var(--border-hover)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{stat.name}</span>
              <div className={cn("p-2 rounded-xl border", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-[var(--bg-hover)] rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-extrabold text-[var(--text-primary)] mb-1">{stat.value}</div>
            )}
            <p className="text-xs text-[var(--text-muted)]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Jobs + Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Job Opportunities */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recommended Jobs</h3>
              <p className="text-xs text-[var(--text-secondary)]">Tailored to your active resume profile</p>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All ({stats?.totalJobs || 0}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-[var(--bg-hover)] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl">
              <Briefcase className="w-10 h-10 text-[var(--text-muted)] mb-2" />
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No jobs discovered yet</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">Run the Job Scout agent or trigger demo mode to discover jobs.</p>
              <Link to="/jobs" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors">
                Discover Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {recentJobs.map(job => (
                <div key={job.id} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-xl transition-all flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">{job.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{job.company} • {job.location || 'Remote'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {job.ats_score > 0 && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border",
                        job.ats_score >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                        job.ats_score >= 60 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                        "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                      )}>
                        {Math.round(job.ats_score)}% Match
                      </span>
                    )}
                    <Link to="/matcher" className="p-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-blue-500 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Applications Tracker Widget */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Active Pipeline</h3>
              <p className="text-xs text-[var(--text-secondary)]">Applications status</p>
            </div>
            <Link to="/applications" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Kanban <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-[var(--bg-hover)] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl">
              <CheckCircle className="w-10 h-10 text-[var(--text-muted)] mb-2" />
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No active applications</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">Track jobs as Saved, Applied, or Interviewing.</p>
              <Link to="/applications" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors">
                Go to Tracker
              </Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {recentApps.map(app => (
                <div key={app.id} className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[var(--text-primary)] truncate">{app.job_title}</h4>
                    <p className="text-[var(--text-muted)] truncate">{app.company}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full font-semibold shrink-0 border",
                    app.status === "Interview" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    app.status === "Offer" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" :
                    app.status === "Applied" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                  )}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Agents Recent Activity Feed */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">Recent AI Multi-Agent Activity</h3>
          </div>
          <Link to="/agents" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            View Agent Logs →
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No agent activity logged yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {recentLogs.map(log => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">[{log.agent_name}]</span>
                  <span className="text-[var(--text-primary)] truncate">{log.action}</span>
                </div>
                <span className="text-[var(--text-muted)] shrink-0 font-mono text-[11px]">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
