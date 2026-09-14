import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Job } from "../types";
import { 
  Search, 
  MapPin, 
  Building, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Target, 
  Mail, 
  CheckCircle, 
  Loader2, 
  Plus,
  X
} from "lucide-react";
import { cn } from "../utils/cn";
import { Link } from "react-router-dom";

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRole, setSearchRole] = useState("Software Engineer");
  const [searchLocation, setSearchLocation] = useState("Bangalore");
  const [searchExperience, setSearchExperience] = useState("0-2");
  const [searchDemoMode, setSearchDemoMode] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; jobs: Job[] }>(`/api/jobs/?search=${encodeURIComponent(search)}`);
      setJobs(Array.isArray(res?.jobs) ? res.jobs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(loadJobs, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleSave = async (jobId: number) => {
    try {
      const res = await api.post<{ success: boolean; is_saved: number }>(`/api/jobs/${jobId}/toggle-save`);
      setJobs(jobs.map(j => j.id === jobId ? { ...j, is_saved: res.is_saved } : j));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDiscoverJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await api.post<{ success: boolean; count: number; jobs: Job[] }>("/api/jobs/search-new", {
        role: searchRole,
        location: searchLocation,
        experience: searchExperience,
        demo_mode: searchDemoMode
      });
      if (res.success) {
        setSearchModalOpen(false);
        showToast(`Discovered ${res.count} jobs for '${searchRole}'!`);
        await loadJobs();
      }
    } catch (err: any) {
      alert(err.message || "Failed to discover jobs");
    } finally {
      setSearching(false);
    }
  };

  const handleTrackApplication = async (jobId: number) => {
    try {
      await api.post("/api/applications/", {
        job_id: jobId,
        status: "Saved"
      });
      showToast("Job added to Application Tracker!");
    } catch (err: any) {
      alert(err.message || "Failed to add to tracker");
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 3500);
  };

  const displayedJobs = filterSavedOnly ? jobs.filter(j => j.is_saved) : jobs;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Search & Filter Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search roles, skills, or companies..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilterSavedOnly(!filterSavedOnly)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer",
              filterSavedOnly 
                ? "bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs" 
                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            )}
          >
            <Bookmark className="w-4 h-4" />
            Saved Jobs ({jobs.filter(j => j.is_saved).length})
          </button>

          <button 
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Discover New Jobs
          </button>
        </div>
      </div>

      {/* Jobs Listing Grid */}
      {loading && jobs.length === 0 ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] animate-pulse"></div>
          ))}
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-xs">
          <Building className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-1">No jobs found</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
            {filterSavedOnly 
              ? "You haven't saved any jobs yet." 
              : "No matching jobs in your database. Click 'Discover New Jobs' to trigger the Job Scout agent."}
          </p>
          <button 
            onClick={() => setSearchModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" /> Discover Jobs Now
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedJobs.map(job => (
            <div key={job.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col md:flex-row gap-5">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-lg font-extrabold text-[var(--text-primary)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors tracking-tight">{job.title}</h3>
                  <button 
                    onClick={() => toggleSave(job.id)} 
                    className="text-[var(--text-muted)] hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer"
                    title={job.is_saved ? "Remove from saved" : "Save job"}
                  >
                    {job.is_saved ? <BookmarkCheck className="w-5 h-5 text-blue-500" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mb-3">
                  <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <Building className="w-3.5 h-3.5 text-blue-500" /> {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {job.location || 'Remote'}
                  </span>
                  {job.salary && <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{job.salary}</span>}
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                  {job.description || job.requirements || "No description excerpt provided."}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-extrabold border shadow-2xs",
                    job.ats_score >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" :
                    job.ats_score >= 60 ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" :
                    job.ats_score >= 40 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25" :
                    "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                  )}>
                    {job.ats_score > 0 ? `${Math.round(job.ats_score)}% ATS Match` : "Unscored"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    Source: {job.source}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col justify-end gap-2 shrink-0 md:border-l md:border-[var(--border-color)] md:pl-5 pt-3 md:pt-0 border-t md:border-t-0">
                <Link
                  to="/matcher"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 rounded-xl text-xs font-bold transition-all active:scale-98"
                >
                  <Target className="w-3.5 h-3.5" /> Match JD
                </Link>

                <Link
                  to="/cover-letters"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/25 rounded-xl text-xs font-bold transition-all active:scale-98"
                >
                  <Mail className="w-3.5 h-3.5" /> Cover Letter
                </Link>

                <button
                  onClick={() => handleTrackApplication(job.id)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Track
                </button>

                {job.url && (
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl transition-colors text-center hidden md:block"
                    title="Open original posting"
                  >
                    <ExternalLink className="w-4 h-4 mx-auto" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discover Jobs Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> Discover New Jobs
              </h3>
              <button onClick={() => setSearchModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDiscoverJobs} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Role</label>
                <input 
                  type="text" 
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Location</label>
                <input 
                  type="text" 
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="e.g. Bangalore, Remote, Pune"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Experience (Years)</label>
                  <select 
                    value={searchExperience}
                    onChange={(e) => setSearchExperience(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="0-2">0 - 2 Years</option>
                    <option value="2-5">2 - 5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Source Mode</label>
                  <select 
                    value={searchDemoMode ? "demo" : "live"}
                    onChange={(e) => setSearchDemoMode(e.target.value === "demo")}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="demo">Demo Dataset</option>
                    <option value="live">Live Scraper</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {searching ? "Searching & Scraping..." : "Run Job Scout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
