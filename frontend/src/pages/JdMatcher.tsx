import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import type { Job, Resume, MatchResult } from "../types";
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles, 
  Mail, 
  ArrowRight,
  Upload,
  FileText,
  Briefcase,
  Layers,
  Award,
  FileCheck
} from "lucide-react";
import { cn } from "../utils/cn";
import { useNavigate } from "react-router-dom";

export function JdMatcher() {
  // Resume state
  const [resumeMode, setResumeMode] = useState<"upload" | "paste" | "select">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [savedResumes, setSavedResumes] = useState<Resume[]>([]);
  const [parsedResumeData, setParsedResumeData] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // Job state
  const [jobMode, setJobMode] = useState<"custom" | "pipeline">("custom");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [pipelineJobs, setPipelineJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Match state
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load existing jobs and saved resumes
    api.get<{ success: boolean; jobs: Job[] }>("/api/jobs/")
      .then(res => {
        setPipelineJobs(res.jobs || []);
        if (res.jobs && res.jobs.length > 0) setSelectedJobId(res.jobs[0].id);
      })
      .catch(console.error);

    api.get<{ success: boolean; resumes: Resume[] }>("/api/resumes/")
      .then(res => {
        setSavedResumes(res.resumes || []);
        const active = res.resumes?.find(r => r.is_active === 1);
        if (active) setSelectedResumeId(active.id);
        else if (res.resumes && res.resumes.length > 0) setSelectedResumeId(res.resumes[0].id);
      })
      .catch(console.error);
  }, []);

  const handleFileUpload = async (file: File) => {
    setResumeFile(file);
    setUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<{ success: boolean; data: any }>("/api/resumes/upload", formData);
      if (res.success && res.data) {
        setParsedResumeData(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse resume file.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleMatch = async () => {
    setLoading(true);
    setMatchResult(null);
    setErrorMessage(null);

    try {
      // Determine JD content
      let finalJd = jdText;
      let finalTitle = jobTitle || "Target Role";
      let finalCompany = company || "Target Company";

      if (jobMode === "pipeline" && selectedJobId) {
        const foundJob = pipelineJobs.find(j => j.id === selectedJobId);
        if (foundJob) {
          finalJd = `${foundJob.description || ""} ${foundJob.requirements || ""}`;
          finalTitle = foundJob.title;
          finalCompany = foundJob.company;
        }
      }

      if (!finalJd.trim()) {
        setErrorMessage("Please enter or select a Job Description.");
        setLoading(false);
        return;
      }

      // Determine Resume content
      let payloadResumeText: string | undefined = undefined;
      let payloadResumeId: number | undefined = undefined;

      if (resumeMode === "upload") {
        if (parsedResumeData?.raw_text) {
          payloadResumeText = parsedResumeData.raw_text;
        } else {
          setErrorMessage("Please upload a resume file first.");
          setLoading(false);
          return;
        }
      } else if (resumeMode === "paste") {
        if (!resumeText.trim()) {
          setErrorMessage("Please paste your resume text.");
          setLoading(false);
          return;
        }
        payloadResumeText = resumeText;
      } else if (resumeMode === "select") {
        if (!selectedResumeId) {
          setErrorMessage("Please select a saved resume.");
          setLoading(false);
          return;
        }
        payloadResumeId = selectedResumeId;
      }

      const res = await api.post<{ success: boolean; match_result: MatchResult }>("/api/jobs/match-custom", {
        jd_text: finalJd,
        job_title: finalTitle,
        company: finalCompany,
        resume_text: payloadResumeText,
        resume_id: payloadResumeId
      });

      if (res.success && res.match_result) {
        setMatchResult(res.match_result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Resume vs JD comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToCoverLetter = () => {
    if (jobMode === "pipeline" && selectedJobId) {
      navigate(`/cover-letters?job_id=${selectedJobId}`);
    } else {
      navigate(`/cover-letters`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-violet-900/40 border border-blue-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Resume Comparison Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Resume vs Job Title Matcher
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Upload your Resume on the left side, enter Job Title & Description on the right side.
              Our ATS engine will compare them and calculate the exact match percentage!
            </p>
          </div>
          <button
            onClick={handleMatch}
            disabled={loading || uploading}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            {loading ? "Calculating Match..." : "Compare & Calculate Match %"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Side-by-Side Split View */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: RESUME SECTION */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Resume (Candidate Side)</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">Upload file, paste text, or select saved profile</p>
                </div>
              </div>

              {/* Resume Mode Tabs */}
              <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] text-[11px] font-semibold">
                <button
                  onClick={() => setResumeMode("upload")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
                    resumeMode === "upload" ? "bg-[var(--bg-card)] text-blue-500 shadow-xs" : "text-[var(--text-secondary)]"
                  )}
                >
                  <Upload className="w-3 h-3" /> Upload
                </button>
                <button
                  onClick={() => setResumeMode("paste")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
                    resumeMode === "paste" ? "bg-[var(--bg-card)] text-blue-500 shadow-xs" : "text-[var(--text-secondary)]"
                  )}
                >
                  <FileText className="w-3 h-3" /> Paste
                </button>
                <button
                  onClick={() => setResumeMode("select")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
                    resumeMode === "select" ? "bg-[var(--bg-card)] text-blue-500 shadow-xs" : "text-[var(--text-secondary)]"
                  )}
                >
                  <FileCheck className="w-3 h-3" /> Saved
                </button>
              </div>
            </div>

            {/* Resume Mode Content */}
            {resumeMode === "upload" && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.docx,.txt" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-blue-500/30 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  {uploading ? (
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-blue-500 opacity-80" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {resumeFile ? resumeFile.name : "Click or Drag & Drop PDF / DOCX Resume"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Supported formats: PDF, DOCX, TXT (Max 10MB)
                    </p>
                  </div>
                </div>

                {parsedResumeData && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Resume Parsed Successfully</span>
                      <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">{parsedResumeData.word_count || 0} words</span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      <p><strong className="text-[var(--text-primary)]">Name:</strong> {parsedResumeData.name}</p>
                      {parsedResumeData.email && <p><strong className="text-[var(--text-primary)]">Email:</strong> {parsedResumeData.email}</p>}
                    </div>
                    {parsedResumeData.skills && parsedResumeData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {parsedResumeData.skills.slice(0, 10).map((sk: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium rounded-md">
                            {sk}
                          </span>
                        ))}
                        {parsedResumeData.skills.length > 10 && (
                          <span className="text-[10px] text-[var(--text-muted)] self-center">+{parsedResumeData.skills.length - 10} more</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {resumeMode === "paste" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">Paste Resume Text</label>
                <textarea
                  rows={10}
                  placeholder="Paste candidate resume experience, skills, and summary here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl p-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
                <div className="text-[10px] text-right text-[var(--text-muted)]">
                  {resumeText.length} characters
                </div>
              </div>
            )}

            {resumeMode === "select" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">Select Saved Resume Profile</label>
                {savedResumes.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] p-4 bg-[var(--bg-secondary)] rounded-2xl">
                    No saved resumes found in database. Switch to 'Upload' or 'Paste'.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedResumes.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedResumeId(r.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex items-center justify-between",
                          selectedResumeId === r.id
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs"
                            : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-500/20"
                        )}
                      >
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{r.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{r.email || "No email"}</div>
                        </div>
                        {r.is_active === 1 && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: JOB TITLE & DESCRIPTION SECTION */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Job Details (Target Role Side)</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">Enter Job Title & Description or choose pipeline job</p>
                </div>
              </div>

              {/* Job Mode Selector */}
              <div className="flex bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] text-[11px] font-semibold">
                <button
                  onClick={() => setJobMode("custom")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
                    jobMode === "custom" ? "bg-[var(--bg-card)] text-violet-500 shadow-xs" : "text-[var(--text-secondary)]"
                  )}
                >
                  <Briefcase className="w-3 h-3" /> Custom Job
                </button>
                <button
                  onClick={() => setJobMode("pipeline")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all flex items-center gap-1",
                    jobMode === "pipeline" ? "bg-[var(--bg-card)] text-violet-500 shadow-xs" : "text-[var(--text-secondary)]"
                  )}
                >
                  <Layers className="w-3 h-3" /> Pipeline ({pipelineJobs.length})
                </button>
              </div>
            </div>

            {/* Job Mode Content */}
            {jobMode === "custom" ? (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Job Title *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Senior Full Stack Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Company Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Google / Microsoft"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Job Description & Requirements *</label>
                  <textarea 
                    rows={8}
                    placeholder="Paste the full job description text, skills requirements, and qualifications here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl p-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-violet-500 font-mono leading-relaxed"
                  />
                  <div className="text-[10px] text-right text-[var(--text-muted)]">
                    {jdText.length} characters
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[var(--text-secondary)] block">Select Job from Active Pipeline</label>
                {pipelineJobs.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] p-4 bg-[var(--bg-secondary)] rounded-2xl">
                    No jobs found in pipeline. Switch to 'Custom Job' to paste job details.
                  </p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {pipelineJobs.map(j => (
                      <button
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex items-center justify-between",
                          selectedJobId === j.id
                            ? "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400 font-semibold shadow-2xs"
                            : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-violet-500/20"
                        )}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-[var(--text-primary)] truncate">{j.title}</div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate">{j.company} • {j.location}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">
                            {j.source}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MATCH RESULTS DISPLAY DASHBOARD */}
      {matchResult && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-md space-y-8 animate-in fade-in duration-500">
          
          {/* Main Score Banner */}
          <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-gradient-to-r from-[var(--bg-secondary)] via-blue-500/5 to-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl">
            {/* Radial Score Gauge */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-200 dark:text-gray-800" />
                <circle 
                  cx="72" cy="72" r="60" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  fill="transparent"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * matchResult.ats_score) / 100}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    matchResult.ats_score >= 80 ? "text-emerald-500" :
                    matchResult.ats_score >= 60 ? "text-blue-500" :
                    matchResult.ats_score >= 40 ? "text-amber-500" : "text-rose-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {Math.round(matchResult.ats_score)}%
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                  Match Score
                </span>
              </div>
            </div>

            {/* Score Text & Summary */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  matchResult.ats_score >= 80 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
                  matchResult.ats_score >= 60 ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" :
                  matchResult.ats_score >= 40 ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" :
                  "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                )}>
                  {matchResult.recommendation}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Job Role: <strong className="text-[var(--text-primary)]">{matchResult.job_title}</strong> @ {matchResult.company}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {matchResult.ats_score >= 80
                  ? "Outstanding alignment! Your resume closely matches the key requirements and tech stack for this role."
                  : matchResult.ats_score >= 60
                  ? "Strong foundation found. Incorporate a few missing keywords to boost your ranking to top tier."
                  : "Moderate match. Consider updating your resume bullet points to highlight skills requested in this job posting."}
              </p>

              <div className="pt-2">
                <button
                  onClick={handleGoToCoverLetter}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Generate Cover Letter <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 5-Component ATS Score Breakdown */}
          {matchResult.breakdown && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" /> Multi-Component ATS Analysis Breakdown
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Skills Alignment (40%)</div>
                  <div className="text-lg font-bold text-blue-500">{matchResult.breakdown.skill_score || 0} / 40</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${((matchResult.breakdown.skill_score || 0) / 40) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Keyword Density (25%)</div>
                  <div className="text-lg font-bold text-indigo-500">{matchResult.breakdown.keyword_score || 0} / 25</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${((matchResult.breakdown.keyword_score || 0) / 25) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Experience (15%)</div>
                  <div className="text-lg font-bold text-purple-500">{matchResult.breakdown.exp_score || 0} / 15</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${((matchResult.breakdown.exp_score || 0) / 15) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Education (10%)</div>
                  <div className="text-lg font-bold text-teal-500">{matchResult.breakdown.edu_score || 0} / 10</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${((matchResult.breakdown.edu_score || 0) / 10) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Text Similarity (10%)</div>
                  <div className="text-lg font-bold text-amber-500">{matchResult.breakdown.sim_score || 0} / 10</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${((matchResult.breakdown.sim_score || 0) / 10) * 100}%` }}></div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Matched vs Missing Keywords Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Matched Keywords */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-3xl p-6">
              <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 className="w-4 h-4" /> Matched Skills & Keywords ({matchResult.matched_keywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchResult.matched_keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold">
                    ✓ {kw}
                  </span>
                ))}
                {(!matchResult.matched_keywords || matchResult.matched_keywords.length === 0) && (
                  <span className="text-xs text-[var(--text-muted)]">No overlapping tech keywords identified.</span>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-3xl p-6">
              <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-4">
                <XCircle className="w-4 h-4" /> Missing Keywords in Resume ({matchResult.missing_keywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchResult.missing_keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
                    ! {kw}
                  </span>
                ))}
                {(!matchResult.missing_keywords || matchResult.missing_keywords.length === 0) && (
                  <span className="text-xs text-emerald-600 font-semibold">
                    All major required keywords are present!
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Strategic Advice */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-3xl p-6 flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Actionable Resume Optimization Advice
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {matchResult.ats_score >= 80 
                  ? "Your resume shows high keyword density and strong alignment. Make sure to tailor your cover letter to highlight project outcomes related to these skills."
                  : `To improve your ATS match score from ${Math.round(matchResult.ats_score)}% to 90%+, consider naturally incorporating key missing terms (such as ${matchResult.missing_keywords?.slice(0, 4).join(", ") || "relevant domain skills"}) into your resume work experience bullets.`}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
