import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Job, CoverLetter } from "../types";
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Loader2, 
  Save, 
  CheckCircle2, 
  FileEdit, 
  AlertCircle
} from "lucide-react";
import { cn } from "../utils/cn";

export function CoverLetters() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [tone, setTone] = useState<"Professional" | "Confident" | "Concise" | "Enthusiastic">("Professional");
  const [length, setLength] = useState<"Short" | "Standard" | "Detailed">("Standard");
  
  const [loading, setLoading] = useState(false);
  const [coverLetterData, setCoverLetterData] = useState<{ content: string; used_ai?: boolean; model?: string; error?: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; jobs: Job[] }>("/api/jobs/").then(res => {
      setJobs(res.jobs);
      if (res.jobs.length > 0) {
        setSelectedJobId(res.jobs[0].id);
        loadExistingLetter(res.jobs[0].id);
      }
    }).catch(console.error);
  }, []);

  const loadExistingLetter = async (jobId: number) => {
    try {
      const res = await api.get<{ success: boolean; cover_letter: CoverLetter }>(`/api/cover-letters/${jobId}`);
      if (res.cover_letter) {
        setCoverLetterData({ content: res.cover_letter.content, used_ai: true });
        setEditedContent(res.cover_letter.content);
      } else {
        setCoverLetterData(null);
        setEditedContent("");
      }
    } catch {
      setCoverLetterData(null);
      setEditedContent("");
    }
  };

  const handleSelectJob = (id: number) => {
    setSelectedJobId(id);
    setIsEditing(false);
    loadExistingLetter(id);
  };

  const handleGenerate = async () => {
    if (!selectedJobId) {
      alert("Please select a job from the list.");
      return;
    }

    setLoading(true);
    setIsEditing(false);
    try {
      const payload: any = {
        job_id: selectedJobId,
        tone,
        length
      };

      const res = await api.post<{ success: boolean; data: any }>("/api/cover-letters/generate", payload);
      if (res.success && res.data) {
        setCoverLetterData(res.data);
        setEditedContent(res.data.content);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedJobId) return;
    try {
      await api.put(`/api/cover-letters/${selectedJobId}`, { content: editedContent });
      if (coverLetterData) {
        setCoverLetterData({ ...coverLetterData, content: editedContent });
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save changes");
    }
  };

  const handleCopy = () => {
    const textToCopy = isEditing ? editedContent : (coverLetterData?.content || "");
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Left Input Pane: Job Selection & Generation Options */}
      <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">Job & Tone Settings</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Select Pipeline Job */}
          <div>
            <label className="font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Select Pipeline Job ({jobs.length})
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl transition-all border",
                    selectedJobId === job.id 
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400 font-semibold" 
                      : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-violet-500/20"
                  )}
                >
                  <div className="font-bold text-[var(--text-primary)] truncate">{job.title}</div>
                  <div className="text-[var(--text-muted)] truncate">{job.company}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="font-semibold text-[var(--text-secondary)] block mb-1.5">Letter Tone</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Professional", "Confident", "Concise", "Enthusiastic"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border font-medium transition-all text-[11px]",
                    tone === t 
                      ? "bg-violet-600 text-white border-violet-600 shadow-2xs" 
                      : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Length Selector */}
          <div>
            <label className="font-semibold text-[var(--text-secondary)] block mb-1.5">Length</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["Short", "Standard", "Detailed"] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLength(l)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border font-medium transition-all text-[11px]",
                    length === l 
                      ? "bg-violet-600 text-white border-violet-600 shadow-2xs" 
                      : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Scribe Writing..." : coverLetterData ? "Regenerate Letter" : "Generate Cover Letter"}
          </button>
        </div>
      </div>

      {/* Right Display & Document Editor Pane */}
      <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
        {!coverLetterData && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Mail className="w-16 h-16 text-[var(--text-muted)] mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Cover Letter Studio</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">
              Select a job, configure your desired tone and length, then click 'Generate Cover Letter' to write a tailored application letter grounded in your resume evidence.
            </p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-violet-600 dark:text-violet-400">
            <Loader2 className="w-10 h-10 mb-3 animate-spin" />
            <p className="text-sm font-semibold animate-pulse">Scribe AI Agent is drafting your cover letter...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Grounding experience against job requirements</p>
          </div>
        ) : coverLetterData ? (
          <div className="flex-1 flex flex-col space-y-4">
            {/* Header Control Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                {coverLetterData.used_ai ? (
                  <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Generated ({coverLetterData.model || 'Ollama'})
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Template Fallback Mode
                  </span>
                )}
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {editedContent.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5" /> {isEditing ? "Done Editing" : "Edit Text"}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Document Viewer / Editor */}
            <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 overflow-y-auto min-h-[350px]">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full min-h-[320px] bg-transparent text-sm text-[var(--text-primary)] font-serif leading-relaxed focus:outline-none resize-none"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-serif text-sm text-[var(--text-primary)] leading-relaxed font-normal">
                  {editedContent}
                </pre>
              )}
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-500 font-semibold text-right">✓ Cover letter saved to job record!</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
