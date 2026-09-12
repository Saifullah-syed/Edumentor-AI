import React, { useState, useEffect } from 'react';
import { roadmapApi, studentApi } from '../../services/api';
import { CareerRoadmap, RoadmapMilestone, Career } from '../../types';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Award,
  Clock,
  Layers,
} from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  const { broadcastProfileUpdate } = useAuth();
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [items, setItems] = useState<RoadmapMilestone[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCareers = async () => {
    try {
      const res = await studentApi.getCareers();
      if (res.data.success) {
        setCareers(res.data.careers);
      }
    } catch (err) {
      console.error('Failed to load careers', err);
    }
  };

  const fetchRoadmap = async (careerId?: number) => {
    try {
      setLoading(true);
      const res = await roadmapApi.getRoadmap(careerId);
      if (res.data.success) {
        setRoadmap(res.data.roadmap);
        setItems(res.data.items || []);
        if (res.data.roadmap?.career_id) {
          setSelectedCareerId(res.data.roadmap.career_id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load career roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
    fetchRoadmap();

    const handleDataUpdate = () => {
      fetchCareers();
      fetchRoadmap();
    };

    window.addEventListener('edumentor_student_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('edumentor_student_data_updated', handleDataUpdate);
    };
  }, []);

  const handleCareerChange = async (careerId: number) => {
    setSelectedCareerId(careerId);
    try {
      await studentApi.updateProfile({ target_career_id: careerId });
      broadcastProfileUpdate();
    } catch (err) {
      console.warn('Failed to synchronize profile target career:', err);
    }
    fetchRoadmap(careerId);
  };

  const handleRegenerate = async () => {
    if (!selectedCareerId) return;
    try {
      setGenerating(true);
      const res = await roadmapApi.generateRoadmap(selectedCareerId);
      if (res.data.success) {
        setRoadmap(res.data.roadmap);
        setItems(res.data.items || []);
        broadcastProfileUpdate();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate new roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleMilestone = async (itemId: number, currentCompleted: number) => {
    const newStatus = currentCompleted === 1 ? false : true;
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, completed: newStatus ? 1 : 0 } : it))
    );

    try {
      await roadmapApi.toggleMilestone(itemId, newStatus);
      broadcastProfileUpdate();
    } catch (err) {
      // Revert if failed
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, completed: currentCompleted } : it))
      );
    }
  };

  const completedCount = items.filter((i) => i.completed === 1).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const difficultyVariant = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'info';
    }
  };

  if (loading && !generating) {
    return <LoadingSpinner message="Retrieving structured career roadmap..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Career Selector */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Strategic Career Pathway
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">AI-Curated Milestones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {roadmap?.title || 'Interactive Career Roadmap'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {roadmap?.summary ||
                'A structured step-by-step pathway from foundational programming to industry portfolio readiness.'}
            </p>
          </div>

          {/* Career Switcher & Regenerate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedCareerId || ''}
              onChange={(e) => handleCareerChange(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
            >
              {careers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Formulating...' : 'Regenerate with AI'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar inside card */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <ProgressBar
            value={completedCount}
            max={totalCount || 1}
            label={`Roadmap Milestone Completion (${completedCount} of ${totalCount} milestones completed)`}
            color="gradient"
            size="md"
          />
        </div>
      </div>

      {/* Roadmap Stages Timeline */}
      <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500/50 before:to-slate-800">
        {items.map((item, index) => {
          const isDone = item.completed === 1;

          return (
            <div
              key={item.id}
              className="relative group transition-all duration-300"
            >
              {/* Timeline Marker Node */}
              <button
                onClick={() => handleToggleMilestone(item.id, item.completed)}
                className={`absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-900 border-2 border-slate-700 text-slate-400 group-hover:border-indigo-500'
                }`}
                title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-[11px] font-bold text-slate-300">{item.step_number}</span>
                )}
              </button>

              {/* Milestone Card */}
              <div
                className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-slate-800 group-hover:border-indigo-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">
                      Stage {item.step_number}
                    </span>
                    <h3
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        isDone ? 'text-emerald-300 line-through' : 'text-white'
                      }`}
                    >
                      {item.skill_or_topic}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={difficultyVariant(item.difficulty)} size="sm">
                      {item.difficulty}
                    </Badge>
                    <button
                      onClick={() => handleToggleMilestone(item.id, item.completed)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-indigo-500/40'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {item.description}
                </p>

                {item.resources && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-start gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Recommended Resources:</strong> {item.resources}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
