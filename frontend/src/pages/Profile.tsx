import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { CandidateProfile, Resume } from "../types";
import { Save, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";

export function Profile() {
  const [profile, setProfile] = useState<CandidateProfile>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    target_roles: "",
    experience: "",
    education: "",
    linkedin: "",
    github: "",
    skills: [],
    theme_pref: "light"
  });

  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; profile: CandidateProfile }>("/api/profile/");
      if (res.success && res.profile) {
        setProfile(res.profile);
        setSkillsText(res.profile.skills?.join(", ") || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSyncFromResume = async () => {
    try {
      const res = await api.get<{ success: boolean; resume: Resume }>("/api/resumes/active");
      if (res.success && res.resume) {
        const r = res.resume;
        setProfile(prev => ({
          ...prev,
          full_name: r.name || prev.full_name,
          email: r.email || prev.email,
          phone: r.phone || prev.phone,
          experience: r.experience || prev.experience,
          education: r.education || prev.education,
          linkedin: r.linkedin || prev.linkedin,
          github: r.github || prev.github,
          skills: r.skills || prev.skills
        }));
        setSkillsText(r.skills?.join(", ") || "");
        setSaveMessage("Profile synchronized from active resume!");
        setTimeout(() => setSaveMessage(""), 3500);
      }
    } catch (err: any) {
      alert("No active resume found to sync from.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const parsedSkills = skillsText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        ...profile,
        skills: parsedSkills
      };

      const res = await api.post<{ success: boolean; profile: CandidateProfile }>("/api/profile/", payload);
      if (res.success) {
        setProfile(res.profile);
        setSaveMessage("Profile updated successfully!");
        setTimeout(() => setSaveMessage(""), 3500);
      }
    } catch (err: any) {
      alert(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Candidate Profile</h2>
          <p className="text-xs text-[var(--text-secondary)]">Manage your career credentials and candidate profile information.</p>
        </div>

        <button
          type="button"
          onClick={handleSyncFromResume}
          className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 border border-[var(--border-color)]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Sync from Active Resume
        </button>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-6 text-xs">
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Personal Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Full Name *</label>
              <input
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Location</label>
              <input
                type="text"
                value={profile.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. Bangalore, India"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Target Roles & Skills */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Target Roles & Core Skills</h3>
          
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Target Job Roles</label>
            <input
              type="text"
              value={profile.target_roles || ""}
              onChange={(e) => setProfile({ ...profile, target_roles: e.target.value })}
              placeholder="e.g. Full Stack Developer, Python Developer, AI Engineer"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Technical Skills (Comma-separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Python, React, TypeScript, FastApi, SQL, Git..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Online Profiles</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">LinkedIn Profile URL</label>
              <input
                type="text"
                value={profile.linkedin || ""}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">GitHub Profile URL</label>
              <input
                type="text"
                value={profile.github || ""}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Experience & Education Text Summaries */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">Experience & Education Summaries</h3>
          
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Experience Highlights</label>
            <textarea
              rows={4}
              value={profile.experience || ""}
              onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">Education Background</label>
            <textarea
              rows={3}
              value={profile.education || ""}
              onChange={(e) => setProfile({ ...profile, education: e.target.value })}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving Profile..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
