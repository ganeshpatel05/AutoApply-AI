import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { AgentLog } from "../types";
import { 
  Bot, 
  Play, 
  Search, 
  BrainCircuit, 
  FileSignature, 
  CheckCircle, 
  Loader2, 
  Activity, 
  Sparkles, 
  X,
  Layers
} from "lucide-react";
import { cn } from "../utils/cn";

export function AiAgents() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  
  // Pipeline Trigger Form State
  const [role, setRole] = useState("Software Engineer");
  const [location, setLocation] = useState("Bangalore");
  const [experience, setExperience] = useState("0-2");
  const [coverCount, setCoverCount] = useState(3);
  const [demoMode, setDemoMode] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [pipelineStartedMsg, setPipelineStartedMsg] = useState("");

  const loadLogs = async () => {
    try {
      const res = await api.get<{ success: boolean; logs: AgentLog[] }>("/api/agents/logs");
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 4000); // Auto refresh logs
    return () => clearInterval(interval);
  }, []);

  const handleRunPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriggering(true);
    try {
      await api.post("/api/agents/run-pipeline", {
        role,
        location,
        experience,
        generate_cover_letters_count: coverCount,
        demo_mode: demoMode
      });
      setPipelineModalOpen(false);
      setPipelineStartedMsg(`Multi-Agent Pipeline started for '${role}'!`);
      setTimeout(() => setPipelineStartedMsg(""), 4000);
      await loadLogs();
    } catch (err: any) {
      alert(err.message || "Failed to start pipeline");
    } finally {
      setTriggering(false);
    }
  };

  // Helper to determine agent status from recent logs
  const getAgentStatus = (name: string) => {
    const agentLogs = logs.filter(l => l.agent_name.toLowerCase().includes(name.toLowerCase()));
    if (agentLogs.length === 0) return { label: "Ready", color: "bg-emerald-500", text: "Ready" };
    const latest = agentLogs[0];
    if (latest.status === "Running") return { label: "Active", color: "bg-blue-500 animate-ping", text: "Running" };
    if (latest.status === "Error") return { label: "Warning", color: "bg-red-500", text: "Error" };
    return { label: "Idle", color: "bg-emerald-500", text: "Active" };
  };

  const agents = [
    { name: "Orchestrator", tag: "Orchestrator", role: "Pipeline Master", icon: Layers, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
    { name: "ResumeMind", tag: "ResumeMind", role: "Resume Intelligence", icon: BrainCircuit, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { name: "Scout", tag: "Scout", role: "Job Discovery", icon: Search, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { name: "Matcher", tag: "Matcher", role: "ATS Scorer", icon: Bot, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
    { name: "Scribe", tag: "Scribe", role: "Cover Letter Writer", icon: FileSignature, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
    { name: "Tracker", tag: "Tracker", role: "Application Tracker", icon: CheckCircle, color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {pipelineStartedMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{pipelineStartedMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">Multi-Agent Command Center</h2>
          <p className="text-xs text-[var(--text-secondary)]">Monitor and orchestrate autonomous career execution agents.</p>
        </div>
        
        <button 
          onClick={() => setPipelineModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
        >
          <Play className="w-4 h-4" /> Trigger Multi-Agent Pipeline
        </button>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const status = getAgentStatus(agent.tag);
          const agentLogs = logs.filter(l => l.agent_name.toLowerCase().includes(agent.tag.toLowerCase()));
          const latestLog = agentLogs[0];

          return (
            <div key={agent.name} className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs", agent.bg, agent.color)}>
                    <agent.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full text-[11px] font-bold text-[var(--text-secondary)] shadow-2xs">
                    <span className={cn("w-1.5 h-1.5 rounded-full", status.color)}></span>
                    <span>{status.text}</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-[var(--text-primary)] tracking-tight">{agent.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium mb-3">{agent.role}</p>

                {latestLog && (
                  <div className="text-[11px] bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] leading-tight shadow-2xs">
                    <span className="font-bold text-[var(--text-primary)] block truncate mb-0.5">{latestLog.action}</span>
                    {latestLog.details && <span className="text-[var(--text-muted)] line-clamp-1">{latestLog.details}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Activity Stream Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs flex flex-col h-[420px]">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xs flex items-center justify-between">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Live Agent Activity Stream ({logs.length})
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] font-mono font-medium">Auto-refreshes every 4s</span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs">
          {loading ? (
            <div className="flex items-center justify-center h-full text-blue-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-[var(--text-muted)] text-center py-16">No agent activity recorded yet.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500/30 rounded-xl transition-all flex items-start gap-3 shadow-2xs">
                <span className="text-[var(--text-muted)] shrink-0 text-[11px]">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span className={cn(
                  "font-bold shrink-0 w-24",
                  log.status === "Error" ? "text-red-500 dark:text-red-400" :
                  log.status === "Running" ? "text-blue-500" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  [{log.agent_name}]
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] font-sans font-semibold">{log.action}</span>
                  {log.details && (
                    <span className="text-[var(--text-muted)] block text-[11px] font-sans mt-0.5 truncate">{log.details}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trigger Pipeline Modal */}
      {pipelineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" /> Run Multi-Agent Pipeline
              </h3>
              <button onClick={() => setPipelineModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunPipeline} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Target Role</label>
                <input 
                  type="text" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore, Remote"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Experience Level</label>
                  <select 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="0-2">0-2 Years</option>
                    <option value="2-5">2-5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">Cover Letters to Write</label>
                  <select 
                    value={coverCount}
                    onChange={(e) => setCoverCount(Number(e.target.value))}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value={1}>Top 1 Job</option>
                    <option value={3}>Top 3 Jobs</option>
                    <option value={5}>Top 5 Jobs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Job Discovery Mode</label>
                <select 
                  value={demoMode ? "demo" : "live"}
                  onChange={(e) => setDemoMode(e.target.value === "demo")}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="demo">Demo Data Mode (Instant)</option>
                  <option value="live">Live Job Scraper</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={triggering}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {triggering ? "Executing Pipeline..." : "Execute 5-Agent Pipeline"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
