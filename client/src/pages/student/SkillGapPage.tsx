import React, { useState, useEffect } from 'react';
import { skillGapApi, studentApi } from '../../services/api';
import { SkillGapAnalysisResponse, Career } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const SkillGapPage: React.FC = () => {
  const [data, setData] = useState<SkillGapAnalysisResponse | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'MATCH' | 'GAP' | 'MISSING'>('ALL');

  const fetchCareers = async () => {
    try {
      const res = await studentApi.getCareers();
      if (res.data.success) {
        setCareers(res.data.careers);
      }
    } catch (err) {
      console.error('Failed to fetch careers', err);
    }
  };

  const fetchAnalysis = async (careerId?: number) => {
    try {
      setLoading(true);
      const res = await skillGapApi.getAnalysis(careerId);
      if (res.data.success) {
        setData(res.data);
        if (res.data.career?.id) {
          setSelectedCareerId(res.data.career.id);
        }
      }
    } catch (err) {
      console.error('Failed to compute skill gap analysis', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
    fetchAnalysis();

    const handleSync = () => {
      fetchCareers();
      fetchAnalysis();
    };

    window.addEventListener('edumentor_student_data_updated', handleSync);
    return () => window.removeEventListener('edumentor_student_data_updated', handleSync);
  }, []);

  const handleCareerChange = (id: number) => {
    setSelectedCareerId(id);
    fetchAnalysis(id);
  };

  if (loading) return <LoadingSpinner message="Calculating real-time skill gap analysis..." />;
  if (!data) {
    return (
      <div className="glass-panel p-8 text-center rounded-3xl">
        <p className="text-slate-400 text-sm">Unable to load skill gap data.</p>
      </div>
    );
  }

  const filteredSkills = data.skills.filter((s) => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Industry Benchmark Matrix
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">{data.career.industry}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Skill Gap Analysis: {data.career.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Compare your current verified skills against industry benchmarks. Actionable AI recommendations explain how to close every identified gap.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-semibold hidden sm:inline">
              Target Career:
            </label>
            <select
              value={selectedCareerId || ''}
              onChange={(e) => handleCareerChange(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Match Alignment
            </span>
            <p className="text-2xl font-bold text-white mt-1">{data.matchPercentage}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Overall qualification readiness</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Matched Skills
            </span>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{data.summary.matches}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Meet or exceed benchmarks</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Needs Improvement
            </span>
            <p className="text-2xl font-bold text-amber-300 mt-1">{data.summary.gaps}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Level upgrade recommended</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Missing Skills
            </span>
            <p className="text-2xl font-bold text-rose-300 mt-1">{data.summary.missing}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Not yet acquired</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'MATCH', 'GAP', 'MISSING'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab === 'ALL'
              ? `All Requirements (${data.skills.length})`
              : tab === 'MATCH'
              ? `Matched (${data.summary.matches})`
              : tab === 'GAP'
              ? `Needs Improvement (${data.summary.gaps})`
              : `Missing (${data.summary.missing})`}
          </button>
        ))}
      </div>

      {/* Skills Matrix Table / Cards */}
      <div className="space-y-3">
        {filteredSkills.map((item) => {
          const isMatch = item.status === 'MATCH';
          const isGap = item.status === 'GAP';
          const isMissing = item.status === 'MISSING';

          return (
            <div
              key={item.skill_id}
              className={`glass-panel rounded-2xl p-5 border transition-all ${
                isMatch
                  ? 'border-emerald-500/30'
                  : isGap
                  ? 'border-amber-500/30'
                  : 'border-rose-500/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isMatch
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isGap
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isMatch ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isGap ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{item.skill_name}</h3>
                      <Badge
                        variant={
                          item.importance === 'critical'
                            ? 'danger'
                            : item.importance === 'recommended'
                            ? 'primary'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {item.importance}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium">({item.category})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-slate-400">Current Level: </span>
                        <strong
                          className={
                            isMatch
                              ? 'text-emerald-400'
                              : isGap
                              ? 'text-amber-400'
                              : 'text-slate-500'
                          }
                        >
                          {item.current_proficiency}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Required Level: </span>
                        <strong className="text-indigo-300">{item.required_proficiency}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      isMatch
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isGap
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {item.status === 'MATCH' && 'MATCH'}
                    {item.status === 'GAP' && 'NEEDS IMPROVEMENT'}
                    {item.status === 'MISSING' && 'MISSING REQUIREMENT'}
                  </span>
                </div>
              </div>

              {/* AI Recommendation Quote */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300">AI Advice: </strong>
                  {item.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
