import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";
import type { Resume as ResumeType, ResumeScore, CandidateProfile } from "../types";
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
  TrendingUp,
  Globe,
  Link as LinkIcon,
  Wand2,
  User,
  PlusCircle,
  Copy,
  Check
} from "lucide-react";
import { cn } from "../utils/cn";

export function Resume() {
  const [activeTab, setActiveTab] = useState<"view" | "builder">("view");
  const [resume, setResume] = useState<ResumeType | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadStep, setUploadStep] = useState<"" | "Uploading..." | "Parsing..." | "Analyzing..." | "Complete">("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);

  // Resume Builder Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    summary: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
    enhance_with_ai: true
  });

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
        setActiveTab("view");
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

  const handleAutofillFromProfile = async () => {
    try {
      setAutofillLoading(true);
      const res = await api.get<{ success: boolean; profile: CandidateProfile }>("/api/profile");
      if (res.success && res.profile) {
        const p = res.profile;
        setFormData(prev => ({
          ...prev,
          name: p.full_name || prev.name,
          email: p.email || prev.email,
          phone: p.phone || prev.phone,
          location: p.location || prev.location,
          linkedin: p.linkedin || prev.linkedin,
          github: p.github || prev.github,
          skills: Array.isArray(p.skills) ? p.skills.join(", ") : prev.skills,
          experience: p.experience || prev.experience,
          education: p.education || prev.education
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter at least your Full Name.");
      return;
    }

    try {
      setIsGenerating(true);
      const skillsArray = formData.skills
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        skills: skillsArray
      };

      const res = await api.post<{ success: boolean; resume: ResumeType; score: ResumeScore }>("/api/resumes/generate", payload);
      
      if (res.success) {
        if (res.resume) setResume(res.resume);
        if (res.score) setScore(res.score);
        setActiveTab("view");
        await loadActiveResume();
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate resume.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyRawText = () => {
    if (resume?.raw_text) {
      navigator.clipboard.writeText(resume.raw_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Resume Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Upload your PDF resume or enter details to build & generate an ATS-friendly resume.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab("view")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "view"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Resume
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "builder"
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Build & Generate
          </button>
        </div>
      </div>

      {/* VIEW TAB: Upload & Active Resume */}
      {activeTab === "view" && (
        <div className="space-y-8">
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

            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!!uploadStep}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> Select PDF File
              </button>
              <button
                onClick={() => setActiveTab("builder")}
                className="px-5 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-violet-500" /> Enter Details & Generate
              </button>
            </div>
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
                      {resume.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-blue-500" /> {resume.email}</span>}
                      {resume.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-500" /> {resume.phone}</span>}
                      {resume.linkedin && <a href={resume.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><Globe className="w-3.5 h-3.5" /> LinkedIn</a>}
                      {resume.github && <a href={resume.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><LinkIcon className="w-3.5 h-3.5" /> GitHub</a>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {resume.raw_text && (
                    <button
                      onClick={handleCopyRawText}
                      className="px-3.5 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                      {copied ? "Copied!" : "Copy Resume"}
                    </button>
                  )}

                  {/* Overall Score Badge */}
                  {score && (
                    <div className="flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-[var(--text-primary)]">{score.total}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Resume Score</div>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
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
                    <Briefcase className="w-4 h-4 text-violet-500" /> Experience & Projects Summary
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
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-4">No active resume uploaded or generated yet.</p>
              <button
                onClick={() => setActiveTab("builder")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Build & Generate Resume Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* BUILDER TAB: Interactive Resume Details Form */}
      {activeTab === "builder" && (
        <form onSubmit={handleGenerateSubmit} className="space-y-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-violet-500" /> Input Resume Details
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Fill out your details to auto-generate a structured, ATS-optimized resume.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutofillFromProfile}
              disabled={autofillLoading}
              className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
            >
              {autofillLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-500" />
              )}
              Auto-Fill from Profile
            </button>
          </div>

          {/* Contact Details Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Personal & Contact Details
            </h3>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Indore, MP, India"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/rahulsharma"
                  value={formData.linkedin}
                  onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/rahulsharma"
                  value={formData.github}
                  onChange={e => setFormData({ ...formData, github: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Professional Summary / Objective
            </label>
            <textarea
              rows={3}
              placeholder="Full Stack Developer with 2+ years of experience building scalable Web Apps using Python, React, and FastAPI..."
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all resize-y font-sans"
            />
          </div>

          {/* Technical Skills */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Technical Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Python, React, TypeScript, FastAPI, PostgreSQL, Docker, AWS, Git, Tailwind CSS"
              value={formData.skills}
              onChange={e => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Experience & Projects */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-violet-500" /> Work Experience
              </label>
              <textarea
                rows={5}
                placeholder="Software Engineer Intern at Tech Corp (Jan 2024 - Present)&#10;- Built microservices with Python and FastAPI&#10;- Optimized database queries reducing response time by 30%"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all resize-y font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-500" /> Key Projects
              </label>
              <textarea
                rows={5}
                placeholder="AutoApply AI - Job Search Automation System&#10;- Developed AI-driven application tracking agent&#10;- Integrated Ollama for ATS resume scoring"
                value={formData.projects}
                onChange={e => setFormData({ ...formData, projects: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all resize-y font-mono"
              />
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> Education & Background
            </label>
            <textarea
              rows={3}
              placeholder="B.Tech in Computer Science & Engineering - XYZ University (2020 - 2024) | CGPA: 8.5/10"
              value={formData.education}
              onChange={e => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all resize-y font-mono"
            />
          </div>

          {/* AI Enhancement Option */}
          <div className="flex items-center gap-3 p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
            <input
              type="checkbox"
              id="enhance_ai"
              checked={formData.enhance_with_ai}
              onChange={e => setFormData({ ...formData, enhance_with_ai: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="enhance_ai" className="text-xs text-[var(--text-primary)] font-medium cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Polish & optimize wording with AI (Ollama LLM)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("view")}
              className="px-5 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating ATS Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> Generate ATS Resume
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
