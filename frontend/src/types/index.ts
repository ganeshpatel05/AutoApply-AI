export interface DashboardStats {
  totalJobs: number;
  savedJobs: number;
  applications: number;
  appliedApps: number;
  emailsSent: number;
  interviews: number;
  offers: number;
  rejected: number;
  averageAtsScore: number;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  url: string;
  source: string;
  salary?: string;
  job_type?: string;
  experience?: string;
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  is_saved: number;
  created_at: string;
}

export interface Resume {
  id: number;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  linkedin: string;
  github: string;
  is_active: number;
  created_at: string;
}

export interface ResumeScore {
  content: number;
  skills: number;
  experience: number;
  education: number;
  completeness: number;
  suggestions: string[];
  total: number;
}

export interface CandidateProfile {
  id?: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  target_roles: string;
  experience: string;
  education: string;
  linkedin: string;
  github: string;
  skills: string[];
  theme_pref: string;
}

export interface Application {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  location: string;
  ats_score: number;
  source: string;
  url: string;
  status: string;
  cover_letter: string;
  notes: string;
  email: string;
  email_sent: number;
  updated_at: string;
}

export interface AgentLog {
  id: number;
  agent_name: string;
  action: string;
  status: string;
  details: string;
  created_at: string;
}

export interface CoverLetter {
  id: number;
  job_id: number;
  content: string;
  created_at: string;
}

export interface MatchResult {
  ats_score: number;
  recommendation: string;
  matched_keywords: string[];
  missing_keywords: string[];
  breakdown?: Record<string, number>;
  job_title?: string;
  company?: string;
}

export interface OllamaStatus {
  status: string;
  base_url: string;
  active_model: string;
  installed_models: string[];
}

export interface SystemStatus {
  api: string;
  database: {
    status: string;
    total_jobs: number;
    total_apps: number;
  };
  ollama: OllamaStatus;
  email: {
    configured: boolean;
    sender: string | null;
  };
}
