import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AdminStats } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleDataUpdate = () => {
      fetchStats();
    };

    window.addEventListener('edumentor_student_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('edumentor_student_data_updated', handleDataUpdate);
    };
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating department academic telemetry..." />;
  if (!stats) return <div className="p-6 text-center text-slate-400">Unable to load admin stats.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-purple-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Department Command Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Academic Advisor Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Cohort-wide academic monitoring, common curriculum skill gaps, and university catalog administration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('admin-students')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Inspect Student Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={stats.totalStudents}
          subtitle="Enrolled under advisement"
          icon={<Users className="w-6 h-6" />}
          trend={`${stats.totalStudents} Enrolled`}
          trendPositive={true}
          accentColor="indigo"
        />

        <StatCard
          title="Average Progress"
          value={`${stats.avgProgress}%`}
          subtitle="Degree trajectory benchmark"
          icon={<GraduationCap className="w-6 h-6" />}
          trend={`Avg GPA: ${stats.avgGpa.toFixed(1)} / 10.0`}
          trendPositive={stats.avgGpa >= 6.5}
          accentColor="emerald"
        />

        <StatCard
          title="Catalog Courses"
          value={stats.totalCourses}
          subtitle="Department offerings"
          icon={<BookOpen className="w-6 h-6" />}
          trend={`${stats.totalCourses} Active Courses`}
          trendPositive={true}
          accentColor="purple"
        />

        <StatCard
          title="Career Pathways"
          value={stats.totalCareers}
          subtitle="Industry benchmark tracks"
          icon={<Briefcase className="w-6 h-6" />}
          trend={`${stats.totalCareers} Tracks Configured`}
          trendPositive={true}
          accentColor="sky"
        />
      </div>

      {/* Two Column Layout: Common Skill Gaps & Target Careers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Skill Gaps across Cohort */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Most Common Student Skill Gaps
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Skills where students require additional academic intervention
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Intervention Focus</span>
            </span>
          </div>

          <div className="space-y-3">
            {stats.commonSkillGaps.map((gap, idx) => {
              const percentage = Math.round(
                (gap.students_needing_improvement / (gap.total_students_requiring || 1)) * 100
              );

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{gap.skill_name}</h4>
                      <span className="text-[10px] text-slate-400">({gap.category})</span>
                    </div>
                    <span className="text-xs font-bold text-amber-400">
                      {gap.students_needing_improvement} of {gap.total_students_requiring} students
                    </span>
                  </div>

                  <ProgressBar
                    value={percentage}
                    max={100}
                    color="amber"
                    size="sm"
                    showPercent={false}
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Curriculum Gap Level</span>
                    <span>{percentage}% of cohort needs upgrade</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Career Popularity & Distribution */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Student Career Specialization Distribution
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Industry target preferences selected by active students
                </p>
              </div>
              <button
                onClick={() => onNavigate('admin-careers')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Manage Tracks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {stats.careerDistribution.map((cd, idx) => {
                const percent = stats.totalStudents > 0 ? Math.round((cd.student_count / stats.totalStudents) * 100) : 0;

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cd.title}</span>
                      <span className="text-xs font-semibold text-indigo-400">
                        {cd.student_count} student{cd.student_count !== 1 ? 's' : ''} ({percent}%)
                      </span>
                    </div>
                    <ProgressBar value={percent} max={100} color="indigo" size="sm" showPercent={false} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advisor Note */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <Award className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Advisor Tip: </strong>
              SQL and Statistics remain the highest-frequency gaps across the Data Science cohort. Consider sponsoring a 4-week weekend workshop on advanced query optimization and inferential testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
