import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import type { Resume as ResumeType, ResumeScore } from "../types";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Award, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Mail, 
  Phone, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "../utils/cn";

export function Resume() {
  const [resume, setResume] = useState<ResumeType | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadStep, setUploadStep] = useState<"" | "Uploading..." | "Parsing..." | "Analyzing..." | "Complete">("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadActiveResume = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; resume: ResumeType }>("/api/resumes/active");
      if (res.success && res.resume) {
        setResume(res.resume);
        try {
          const scoreRes = await api.get<{ success: boolean; score: ResumeScore }>("/api/resumes/active/score");
          if (scoreRes.success) setScore(scoreRes.score);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveResume();
  }, []);

  const processFile = async (file: File) => {
    if (!file || !file.name.endsWith(".pdf")) {
      alert("Please upload a valid PDF file.");
      return;
    }

    try {
      setUploadStep("Uploading...");
      const formData = new FormData();
      formData.append("file", file);

      setUploadStep("Parsing...");
      await new Promise(r => setTimeout(r, 400));
      
      setUploadStep("Analyzing...");
      const uploadRes = await api.post("/api/resumes/upload", formData);
      
      if (uploadRes) {
        setUploadStep("Complete");
        await loadActiveResume();
      }
    } catch (err: any) {
      alert(err.message || "Failed to parse resume.");
    } finally {
      setTimeout(() => setUploadStep(""), 1500);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Upload Drag & Drop Dropzone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "bg-[var(--bg-card)] border-2 border-dashed rounded-2xl p-8 text-center transition-all shadow-xs relative overflow-hidden",
          isDragOver ? "border-blue-500 bg-blue-500/5" : "border-[var(--border-color)] hover:border-blue-500/40",
          uploadStep && "pointer-events-none opacity-90"
        )}
      >
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
          {uploadStep ? (
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-7 h-7 text-blue-500" />
          )}
        </div>

        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
          {uploadStep ? uploadStep : "Upload your resume PDF"}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-5 max-w-md mx-auto">
          Drag & drop your PDF file here, or click to browse. ResumeMind will parse your skills, work history, and contact details.
        </p>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploadStep}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50"
        >
          <FileText className="w-4 h-4" /> Select PDF File
        </button>
      </div>

      {loading ? (
        <div className="h-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] animate-pulse"></div>
      ) : resume ? (
        <div className="space-y-6">
          {/* Active Profile Header Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                {resume.name ? resume.name.charAt(0).toUpperCase() : "C"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{resume.name}</h2>
                  <span className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Profile
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mt-2">
                  {resume.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {resume.email}</span>}
                  {resume.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {resume.phone}</span>}
                </div>
              </div>
            </div>

            {/* Overall Score Badge */}
            {score && (
              <div className="flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3.5 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[var(--text-primary)]">{score.total}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Resume Score</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>

          {/* Resume Score Breakdown & AI Recommendations */}
          {score && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Detailed Metrics */}
              <div className="md:col-span-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" /> Score Breakdown
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                      <span>Skills Coverage</span>
                      <span>{score.skills}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${score.skills}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                      <span>Experience Depth</span>
                      <span>{score.experience}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${score.experience}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                      <span>Education & Credentials</span>
                      <span>{score.education}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${score.education}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                      <span>Content Quality</span>
                      <span>{score.content}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${score.content}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable AI Recommendations */}
              <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Actionable Recommendations
                  </h4>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    {score.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2.5 p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Skills */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500" /> Extracted Skills ({resume.skills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-medium shadow-2xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience & Education Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-500" /> Experience Summary
              </h4>
              <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed max-h-64 overflow-y-auto font-mono">
                {resume.experience || "No experience section parsed."}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" /> Education & Background
              </h4>
              <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed max-h-64 overflow-y-auto font-mono">
                {resume.education || "No education section parsed."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
          <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No active resume uploaded yet.</p>
        </div>
      )}
    </div>
  );
}
