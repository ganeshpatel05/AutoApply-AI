import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { DashboardStats } from "../types";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Loader2, TrendingUp, Award, Briefcase, CheckCircle, PieChart } from "lucide-react";

export function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; stats: DashboardStats }>("/api/analytics/")
      .then(res => {
        if (res.success) setStats(res.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64 text-blue-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const funnelData = [
    { name: "Discovered", count: stats.totalJobs, fill: "#3b82f6" },
    { name: "Saved", count: stats.savedJobs, fill: "#6366f1" },
    { name: "Applied", count: stats.appliedApps, fill: "#8b5cf6" },
    { name: "Interview", count: stats.interviews, fill: "#ec4899" },
    { name: "Offers", count: stats.offers, fill: "#10b981" }
  ];

  const conversionRate = stats.appliedApps > 0 
    ? ((stats.interviews / stats.appliedApps) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{conversionRate}%</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Interview to application ratio</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Avg ATS Score</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{stats.averageAtsScore.toFixed(1)}%</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Across scored job descriptions</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Discovered</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{stats.totalJobs}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Jobs parsed by Scout</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Offers Received</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{stats.offers}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Final stage pipeline offers</p>
        </div>
      </div>

      {/* Main Funnel Chart */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Application Pipeline Funnel</h3>
            <p className="text-xs text-[var(--text-secondary)]">Conversion volume at each stage of your career search.</p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-hover)' }}
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={65}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <h4 className="font-bold text-sm text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-500" /> Pipeline Stage Counts
          </h4>
          <div className="divide-y divide-[var(--border-color)] text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-[var(--text-secondary)]">Saved Jobs</span>
              <span className="font-bold text-[var(--text-primary)]">{stats.savedJobs}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[var(--text-secondary)]">Applications Submitted</span>
              <span className="font-bold text-[var(--text-primary)]">{stats.appliedApps}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[var(--text-secondary)]">Emails Sent via SMTP</span>
              <span className="font-bold text-[var(--text-primary)]">{stats.emailsSent}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[var(--text-secondary)]">Interviews Scheduled</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-bold">{stats.interviews}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[var(--text-secondary)]">Rejections</span>
              <span className="font-bold text-red-500 dark:text-red-400">{stats.rejected}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-[var(--text-primary)] mb-2">Performance Insights</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Your average ATS match score across candidate applications is <strong className="text-[var(--text-primary)]">{stats.averageAtsScore.toFixed(1)}%</strong>.
            </p>
          </div>
          <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-blue-600 dark:text-blue-400 block mb-1">Tip to increase conversion:</strong>
            Use the Cover Letter Studio to generate job-grounded letters for all saved applications before advancing them to 'Applied'.
          </div>
        </div>
      </div>
    </div>
  );
}
