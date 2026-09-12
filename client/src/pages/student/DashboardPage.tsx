import React, { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';
import { DashboardSummary } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Award,
  ArrowUpRight,
  Sparkles,
  Compass,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Target,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getDashboard();
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleSync = () => {
      fetchDashboard();
    };

    window.addEventListener('edumentor_student_data_updated', handleSync);
    return () => window.removeEventListener('edumentor_student_data_updated', handleSync);
  }, []);

  if (loading) return <LoadingSpinner message="Assembling personalized academic intelligence..." />;
  if (error || !summary) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-rose-400">{error || 'Unable to load student metrics.'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Academic Session 2025–2026
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">{summary.university}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {summary.studentName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl">
              Enrolled in <span className="text-slate-200 font-semibold">{summary.program}</span> (
              {summary.degree}). Your personalized academic and career advisor is ready to guide your next semester.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('advisor')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Advisor</span>
            </button>
            <button
              onClick={() => onNavigate('roadmap')}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>View Roadmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Academic Progress"
          value={`${summary.academicProgress || 0}%`}
          subtitle="Degree completion benchmark"
          icon={<GraduationCap className="w-6 h-6" />}
          trend={`${summary.courses?.completed_credits ?? 0} credits completed`}
          trendPositive={true}
          accentColor="indigo"
        />

        <StatCard
          title="Target Career"
          value={summary.targetCareer || 'Career Track'}
          subtitle="Selected industry track"
          icon={<Briefcase className="w-6 h-6" />}
          trend="High Growth (+35%)"
          trendPositive={true}
          accentColor="purple"
        />

        <StatCard
          title="Completed Courses"
          value={`${summary.courses?.completed_courses ?? 0} / ${summary.courses?.total_courses ?? 0}`}
          subtitle={`${summary.courses?.in_progress_courses ?? 0} currently in progress`}
          icon={<BookOpen className="w-6 h-6" />}
          trend={`GPA: ${summary.gpa !== undefined && summary.gpa !== null ? Number(summary.gpa).toFixed(2) : '3.50'} / 10.0`}
          trendPositive={(summary.gpa || 0) >= 6.0}
          accentColor="emerald"
        />

        <StatCard
          title="Skill Benchmark"
          value={`${summary.skillGaps?.matches ?? 0} Matched`}
          subtitle={`${summary.skillGaps?.gaps ?? 0} gaps needing work`}
          icon={<Target className="w-6 h-6" />}
          trend={`${summary.skills?.length ?? 0} skills in profile`}
          trendPositive={(summary.skillGaps?.matches ?? 0) > 0}
          accentColor="sky"
        />
      </div>

      {/* Two Column Layout: Roadmap & Gap Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Skill Gap & Recommended Next Step */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skill Gap Summary Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Skill Alignment for {summary.targetCareer}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison against industry recruitment requirements
                </p>
              </div>
              <button
                onClick={() => onNavigate('skillgap')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Analysis</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xl font-bold text-emerald-400">{summary.skillGaps.matches}</span>
                <p className="text-[11px] font-medium text-slate-300 mt-0.5">Matched Skills</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xl font-bold text-amber-400">{summary.skillGaps.gaps}</span>
                <p className="text-[11px] font-medium text-slate-300 mt-0.5">Needs Improvement</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-xl font-bold text-rose-400">{summary.skillGaps.missing}</span>
                <p className="text-[11px] font-medium text-slate-300 mt-0.5">Missing Skills</p>
              </div>
            </div>

            {/* Current Verified Skills Tags */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2.5">Current Skills on Profile:</p>
              <div className="flex flex-wrap gap-2">
                {summary.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({s.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Next Actions Box */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 bg-gradient-to-br from-indigo-950/20 to-slate-900">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Recommended Next Step
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  Complete Relational Databases &amp; Advanced SQL Fundamentals
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Your current SQL proficiency is at a beginner level. For your target career as a{' '}
                  <strong className="text-slate-200">{summary.targetCareer}</strong>, intermediate SQL (window functions, subqueries, and database indexing) is a critical requirement.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => onNavigate('learningplan')}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    View Weekly Study Plan
                  </button>
                  <button
                    onClick={() => onNavigate('advisor')}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    Ask AI How to Prepare
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roadmap Status & Resume Analysis */}
        <div className="space-y-6">
          {/* Active Roadmap Progress */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight">Active Roadmap</h2>
              <button
                onClick={() => onNavigate('roadmap')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View
              </button>
            </div>

            {summary.roadmap ? (
              <div>
                <p className="text-xs font-semibold text-slate-200 mb-1">{summary.roadmap.title}</p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {summary.roadmap.completed_steps} of {summary.roadmap.total_steps} milestones completed
                </p>
                <ProgressBar
                  value={summary.roadmap.completed_steps}
                  max={summary.roadmap.total_steps || 1}
                  color="gradient"
                  size="md"
                />
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-400">
                    Next milestone: <span className="text-indigo-300 font-medium">Relational Databases &amp; Complex SQL</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-3">No career roadmap generated yet.</p>
                <button
                  onClick={() => onNavigate('roadmap')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Generate Roadmap
                </button>
              </div>
            )}
          </div>

          {/* Resume Intelligence Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Resume Intelligence</h3>
              </div>
              <button
                onClick={() => onNavigate('resume')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Analyze
              </button>
            </div>

            {summary.recentResume ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Overall ATS Score</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {summary.recentResume.overall_score} / 100
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Career Alignment</span>
                  <span className="text-lg font-bold text-indigo-400">
                    {summary.recentResume.career_alignment_score}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  Last evaluated: {new Date(summary.recentResume.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400 mb-3">
                  Upload your resume for AI critique, skill extraction, and gap identification.
                </p>
                <button
                  onClick={() => onNavigate('resume')}
                  className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Upload Resume (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
