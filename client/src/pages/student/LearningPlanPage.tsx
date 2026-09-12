import React, { useState, useEffect } from 'react';
import { learningPlanApi, studentApi } from '../../services/api';
import { LearningPlan, LearningPlanItem, Career } from '../../types';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CalendarCheck,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const LearningPlanPage: React.FC = () => {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [items, setItems] = useState<LearningPlanItem[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form parameters
  const [selectedCareer, setSelectedCareer] = useState<string>('Data Scientist');
  const [timeframeWeeks, setTimeframeWeeks] = useState<number>(8);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await learningPlanApi.getPlan();
      if (res.data.success) {
        setPlan(res.data.plan);
        setItems(res.data.items || []);
        if (res.data.plan?.target_career) {
          setSelectedCareer(res.data.plan.target_career);
        }
        if (res.data.plan?.timeframe_weeks) {
          setTimeframeWeeks(Number(res.data.plan.timeframe_weeks));
        }
        if (res.data.plan?.hours_per_week) {
          setHoursPerWeek(Number(res.data.plan.hours_per_week));
        }
      }
    } catch (err) {
      console.error('Failed to load learning plan', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCareers = async () => {
    try {
      const res = await studentApi.getCareers();
      if (res.data.success) setCareers(res.data.careers);
    } catch (err) {
      console.error('Failed to load careers', err);
    }
  };

  useEffect(() => {
    fetchPlan();
    fetchCareers();

    const handleDataUpdate = () => {
      fetchPlan();
      fetchCareers();
    };

    window.addEventListener('edumentor_student_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('edumentor_student_data_updated', handleDataUpdate);
    };
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await learningPlanApi.generatePlan({
        target_career: selectedCareer,
        timeframe_weeks: timeframeWeeks,
        hours_per_week: hoursPerWeek,
      });

      if (res.data.success) {
        setPlan(res.data.plan);
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to generate learning plan', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleWeek = async (itemId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? false : true;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, completed: newStatus ? 1 : 0 } : it))
    );

    try {
      await learningPlanApi.togglePlanItem(itemId, newStatus);
    } catch (err) {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, completed: currentStatus } : it))
      );
    }
  };

  const completedWeeks = items.filter((i) => i.completed === 1).length;
  const totalWeeks = items.length;
  const progressPercent = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  if (loading && !generating) {
    return <LoadingSpinner message="Retrieving structured weekly learning plan..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Plan Configurator / Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Personalized AI Curriculum
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">Target Pace: {hoursPerWeek} hrs/week</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {plan?.title || `${timeframeWeeks}-Week ${selectedCareer} Learning Plan`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              AI-generated week-by-week curriculum tailored to your target career, available study schedule, and current academic gaps.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <form
          onSubmit={handleGeneratePlan}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Career</label>
            <select
              value={selectedCareer}
              onChange={(e) => setSelectedCareer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              {careers.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Weeks)</label>
            <select
              value={timeframeWeeks}
              onChange={(e) => setTimeframeWeeks(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={4}>4 Weeks (Intensive)</option>
              <option value={8}>8 Weeks (Standard)</option>
              <option value={12}>12 Weeks (Semester)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Available Hours / Week</label>
            <select
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={5}>5 hrs/week (Light)</option>
              <option value={10}>10 hrs/week (Moderate)</option>
              <option value={15}>15 hrs/week (Dedicated)</option>
              <option value={20}>20+ hrs/week (Bootcamp)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Formulating Plan...' : 'Generate New Plan'}</span>
            </button>
          </div>
        </form>

        {/* Progress bar inside card */}
        {totalWeeks > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <ProgressBar
              value={completedWeeks}
              max={totalWeeks}
              label={`Curriculum Progress (${completedWeeks} of ${totalWeeks} weeks completed)`}
              color="emerald"
              size="md"
            />
          </div>
        )}
      </div>

      {/* Week Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const isDone = item.completed === 1;

          return (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : 'border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Week {item.week_number}
                    </span>
                    <Badge variant={isDone ? 'success' : 'neutral'} size="sm">
                      {isDone ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>

                  <button
                    onClick={() => handleToggleWeek(item.id, item.completed)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isDone ? 'Mark week as incomplete' : 'Mark week completed'}
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 hover:text-indigo-400" />
                    )}
                  </button>
                </div>

                <h3
                  className={`text-base font-bold tracking-tight mb-2 ${
                    isDone ? 'text-emerald-200 line-through' : 'text-white'
                  }`}
                >
                  {item.topic}
                </h3>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  <strong className="text-slate-200">Objective: </strong>
                  {item.objective}
                </p>

                {/* Task Checklist */}
                {item.tasks && item.tasks.length > 0 && (
                  <div className="space-y-1.5 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Weekly Milestones:
                    </p>
                    {item.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-indigo-400">•</span>
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {item.resources && (
                <div className="pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{item.resources}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
