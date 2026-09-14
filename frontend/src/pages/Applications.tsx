import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Application, Job } from "../types";
import { 
  Building, 
  MapPin, 
  Calendar, 
  Loader2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  X
} from "lucide-react";
import { cn } from "../utils/cn";

const KANBAN_COLUMNS = ["Saved", "Applied", "Screening", "Interview", "Offer", "Rejected", "Withdrawn"];

export function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // New App Form State
  const [newJobId, setNewJobId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("Saved");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes] = await Promise.all([
        api.get<{ success: boolean; applications: Application[] }>("/api/applications/"),
        api.get<{ success: boolean; jobs: Job[] }>("/api/jobs/")
      ]);
      if (appsRes?.success && Array.isArray(appsRes.applications)) setApps(appsRes.applications);
      if (jobsRes?.success && Array.isArray(jobsRes.jobs)) {
        setJobs(jobsRes.jobs);
        if (jobsRes.jobs.length > 0) setNewJobId(jobsRes.jobs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (appId: number, status: string, notes?: string) => {
    setUpdatingId(appId);
    try {
      await api.put(`/api/applications/${appId}/status`, { status, notes });
      setApps(apps.map(a => a.id === appId ? { ...a, status, notes: notes !== undefined ? notes : a.notes } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status, notes: notes !== undefined ? notes : selectedApp.notes });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobId) return;
    setCreating(true);
    try {
      const res = await api.post<{ success: boolean; application: Application }>("/api/applications/", {
        job_id: newJobId,
        status: newStatus,
        notes: newNotes
      });
      if (res.success) {
        setAddModalOpen(false);
        setNewNotes("");
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create application");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApplication = async (appId: number) => {
    if (!confirm("Are you sure you want to delete this application record?")) return;
    try {
      await api.delete(`/api/applications/${appId}`);
      setApps(apps.filter(a => a.id !== appId));
      if (selectedApp?.id === appId) setSelectedApp(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete application");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Application Pipeline</h2>
          <p className="text-xs text-[var(--text-secondary)]">Manage target applications across pipeline stages.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-blue-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        /* Kanban Board Columns */
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {KANBAN_COLUMNS.map(column => {
            const columnApps = apps.filter(a => a.status === column);
            return (
              <div key={column} className="flex-shrink-0 w-76 flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
                {/* Column Header */}
                <div className="p-3.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-between items-center">
                  <h3 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider">{column}</h3>
                  <span className="bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[11px] py-0.5 px-2.5 rounded-full font-bold">
                    {columnApps.length}
                  </span>
                </div>
                
                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnApps.map(app => (
                    <div 
                      key={app.id} 
                      onClick={() => setSelectedApp(app)}
                      className={cn(
                        "bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-xl p-4 shadow-2xs cursor-pointer transition-all hover:scale-[1.01]",
                        updatingId === app.id && "opacity-50 pointer-events-none"
                      )}
                    >
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1 leading-snug">{app.job_title}</h4>
                      
                      <div className="space-y-1 text-xs text-[var(--text-secondary)] mb-3">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{app.company}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span className="truncate">{app.location || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span>{new Date(app.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-md border",
                          app.ats_score >= 80 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          app.ats_score >= 60 ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                          "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        )}>
                          {Math.round(app.ats_score)}% Match
                        </span>

                        <select
                          value={app.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                        >
                          {KANBAN_COLUMNS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  
                  {columnApps.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-[var(--text-muted)]">No applications</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Application Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Job to Tracker</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Select Job</label>
                <select
                  value={newJobId || ""}
                  onChange={(e) => setNewJobId(Number(e.target.value))}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  {KANBAN_COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">Notes / Reminders</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Applied via LinkedIn referral..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newJobId}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {creating ? "Adding..." : "Add Application"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-full text-[11px] uppercase tracking-wider">
                  {selectedApp.status}
                </span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">{selectedApp.job_title}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{selectedApp.company} • {selectedApp.location || "Remote"}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Details */}
            <div className="space-y-3 text-xs bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">ATS Match Score:</span>
                <span className="font-bold text-[var(--text-primary)]">{Math.round(selectedApp.ats_score)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Source:</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedApp.source}</span>
              </div>
              {selectedApp.url && (
                <div className="flex justify-between items-center pt-1 border-t border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Job Link:</span>
                  <a href={selectedApp.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                    Open Posting <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-[var(--text-secondary)]">Notes & Activity Logs</label>
              <textarea
                rows={3}
                defaultValue={selectedApp.notes || ""}
                onBlur={(e) => handleStatusChange(selectedApp.id, selectedApp.status, e.target.value)}
                placeholder="Add notes about interview schedule, contact person, or follow-ups..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => handleDeleteApplication(selectedApp.id)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
