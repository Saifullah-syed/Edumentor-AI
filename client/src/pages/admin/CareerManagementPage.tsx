import React, { useState, useEffect } from 'react';
import { adminApi, studentApi } from '../../services/api';
import { Career, Skill } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Briefcase, Plus, Trash2, Target, Award, Sparkles, Edit3, Edit2, AlertCircle, AlertTriangle } from 'lucide-react';

export const CareerManagementPage: React.FC = () => {
  const [careers, setCareers] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddCareerOpen, setIsAddCareerOpen] = useState(false);
  const [isEditCareerOpen, setIsEditCareerOpen] = useState(false);
  const [isDeleteCareerOpen, setIsDeleteCareerOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isEditSkillOpen, setIsEditSkillOpen] = useState(false);

  const [activeCareerId, setActiveCareerId] = useState<number | null>(null);
  const [deletingCareer, setDeletingCareer] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [careerForm, setCareerForm] = useState({
    title: '',
    industry: 'Software & Cloud Engineering',
    average_salary: '$120,000 - $160,000/yr',
    outlook: 'High (+28% growth)',
    description: '',
  });

  const [editCareerForm, setEditCareerForm] = useState({
    title: '',
    industry: '',
    average_salary: '',
    outlook: '',
    description: '',
  });

  const [skillForm, setSkillForm] = useState({
    skill_id: '',
    required_proficiency: 'Intermediate',
    importance: 'critical',
  });

  const [editSkillForm, setEditSkillForm] = useState<{
    skill_id: number;
    skill_name: string;
    required_proficiency: string;
    importance: string;
  }>({
    skill_id: 0,
    skill_name: '',
    required_proficiency: 'Intermediate',
    importance: 'critical',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        adminApi.getCareers(),
        studentApi.getAvailableSkills(),
      ]);
      if (cRes.data.success) setCareers(cRes.data.careers || []);
      if (sRes.data.success) setAllSkills(sRes.data.skills || []);
    } catch (err) {
      console.error('Failed to load career management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCareer(careerForm);
      setIsAddCareerOpen(false);
      setCareerForm({
        title: '',
        industry: 'Software & Cloud Engineering',
        average_salary: '$120,000 - $160,000/yr',
        outlook: 'High (+28% growth)',
        description: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create career', err);
    }
  };

  const handleOpenEditCareer = (career: any) => {
    setActiveCareerId(career.id);
    setEditCareerForm({
      title: career.title || '',
      industry: career.industry || '',
      average_salary: career.average_salary || '',
      outlook: career.outlook || '',
      description: career.description || '',
    });
    setIsEditCareerOpen(true);
  };

  const handleUpdateCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCareerId) return;
    try {
      await adminApi.updateCareer(activeCareerId, editCareerForm);
      setIsEditCareerOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to update career', err);
    }
  };

  const handleOpenDeleteCareer = (career: any) => {
    setDeletingCareer(career);
    setDeleteError(null);
    setIsDeleteCareerOpen(true);
  };

  const handleConfirmDeleteCareer = async () => {
    if (!deletingCareer) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await adminApi.deleteCareer(deletingCareer.id);
      setIsDeleteCareerOpen(false);
      setDeletingCareer(null);
      loadData();
    } catch (err: any) {
      setDeleteError(
        err.response?.data?.message || 'Failed to delete career pathway.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddSkillToCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCareerId || !skillForm.skill_id) return;
    try {
      await adminApi.addCareerSkill(activeCareerId, {
        skill_id: Number(skillForm.skill_id),
        required_proficiency: skillForm.required_proficiency,
        importance: skillForm.importance,
      });
      setIsAddSkillOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to link skill to career', err);
    }
  };

  const handleOpenEditSkill = (careerId: number, req: any) => {
    setActiveCareerId(careerId);
    setEditSkillForm({
      skill_id: req.skill_id,
      skill_name: req.name,
      required_proficiency: req.required_proficiency || 'Intermediate',
      importance: req.importance || 'critical',
    });
    setIsEditSkillOpen(true);
  };

  const handleUpdateSkillReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCareerId || !editSkillForm.skill_id) return;
    try {
      await adminApi.updateCareerSkill(activeCareerId, editSkillForm.skill_id, {
        required_proficiency: editSkillForm.required_proficiency,
        importance: editSkillForm.importance,
      });
      setIsEditSkillOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to update career skill requirement', err);
    }
  };

  const handleRemoveSkill = async (careerId: number, skillId: number) => {
    try {
      await adminApi.removeCareerSkill(careerId, skillId);
      loadData();
    } catch (err) {
      console.error('Failed to remove skill benchmark', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Recruiting Standard Benchmarks
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Career Pathways &amp; Skill Requirements
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure industry competency benchmarks used by the AI Advisor and Skill Gap analyzer.
            </p>
          </div>

          <button
            onClick={() => setIsAddCareerOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Career Track</span>
          </button>
        </div>
      </div>

      {/* Career Cards List */}
      {loading ? (
        <LoadingSpinner message="Loading career standards and benchmarks..." />
      ) : (
        <div className="space-y-6">
          {careers.map((career) => (
            <div
              key={career.id}
              className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white">{career.title}</h2>
                    <Badge variant="primary" size="sm">
                      {career.industry}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {career.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>
                      Avg Salary: <strong className="text-emerald-400">{career.average_salary}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Job Outlook: <strong className="text-purple-300">{career.outlook}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenEditCareer(career)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Edit career details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleOpenDeleteCareer(career)}
                    className="px-3 py-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Delete career track"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveCareerId(career.id);
                      setSkillForm({ skill_id: '', required_proficiency: 'Intermediate', importance: 'critical' });
                      setIsAddSkillOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Skill</span>
                  </button>
                </div>
              </div>

              {/* Required Skills Grid */}
              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span>Configured Competency Benchmarks ({career.requiredSkills?.length || 0})</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(career.requiredSkills || []).map((req: any) => (
                    <div
                      key={req.career_skill_id}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between group hover:border-slate-700"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{req.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({req.category})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              req.required_proficiency === 'Advanced'
                                ? 'danger'
                                : req.required_proficiency === 'Intermediate'
                                ? 'warning'
                                : 'success'
                            }
                            size="sm"
                          >
                            {req.required_proficiency} Req
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {req.importance}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditSkill(career.id, req)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Edit requirement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveSkill(career.id, req.skill_id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove requirement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Career Track Modal */}
      <Modal isOpen={isAddCareerOpen} onClose={() => setIsAddCareerOpen(false)} title="Add Career Pathway">
        <form onSubmit={handleCreateCareer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Career Title</label>
            <input
              type="text"
              required
              value={careerForm.title}
              onChange={(e) => setCareerForm({ ...careerForm, title: e.target.value })}
              placeholder="e.g. Cybersecurity Analyst"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Sector</label>
            <input
              type="text"
              required
              value={careerForm.industry}
              onChange={(e) => setCareerForm({ ...careerForm, industry: e.target.value })}
              placeholder="Cybersecurity &amp; Information Assurance"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salary Range</label>
              <input
                type="text"
                value={careerForm.average_salary}
                onChange={(e) => setCareerForm({ ...careerForm, average_salary: e.target.value })}
                placeholder="$110,000 - $145,000/yr"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Outlook</label>
              <input
                type="text"
                value={careerForm.outlook}
                onChange={(e) => setCareerForm({ ...careerForm, outlook: e.target.value })}
                placeholder="Very High (+32% growth)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={careerForm.description}
              onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
              placeholder="Scope of practice, day-to-day responsibilities, and expected competencies..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddCareerOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Create Career Track
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Skill Benchmark Modal */}
      <Modal isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} title="Link Skill Benchmark">
        <form onSubmit={handleAddSkillToCareer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Skill</label>
            <select
              required
              value={skillForm.skill_id}
              onChange={(e) => setSkillForm({ ...skillForm, skill_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Skill --</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Proficiency
              </label>
              <select
                value={skillForm.required_proficiency}
                onChange={(e) => setSkillForm({ ...skillForm, required_proficiency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Requirement Tier</label>
              <select
                value={skillForm.importance}
                onChange={(e) => setSkillForm({ ...skillForm, importance: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="critical">Critical (Mandatory)</option>
                <option value="recommended">Recommended (Strong Plus)</option>
                <option value="optional">Optional (Elective)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddSkillOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!skillForm.skill_id}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Add Benchmark
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Career Track Modal */}
      <Modal isOpen={isEditCareerOpen} onClose={() => setIsEditCareerOpen(false)} title="Edit Career Pathway">
        <form onSubmit={handleUpdateCareer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Career Title</label>
            <input
              type="text"
              required
              value={editCareerForm.title}
              onChange={(e) => setEditCareerForm({ ...editCareerForm, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Sector</label>
            <input
              type="text"
              required
              value={editCareerForm.industry}
              onChange={(e) => setEditCareerForm({ ...editCareerForm, industry: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salary Range</label>
              <input
                type="text"
                value={editCareerForm.average_salary}
                onChange={(e) => setEditCareerForm({ ...editCareerForm, average_salary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Outlook</label>
              <input
                type="text"
                value={editCareerForm.outlook}
                onChange={(e) => setEditCareerForm({ ...editCareerForm, outlook: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              required
              value={editCareerForm.description}
              onChange={(e) => setEditCareerForm({ ...editCareerForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditCareerOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Career Confirmation Modal */}
      <Modal
        isOpen={isDeleteCareerOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteCareerOpen(false);
            setDeletingCareer(null);
            setDeleteError(null);
          }
        }}
        title="Delete Career Pathway"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to permanently remove the{' '}
            <strong className="text-white font-semibold">"{deletingCareer?.title}"</strong> career pathway?
          </p>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            This will delete this pathway and its benchmark skills. Active student targets will prevent deletion to preserve data integrity.
          </p>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => {
                setIsDeleteCareerOpen(false);
                setDeletingCareer(null);
                setDeleteError(null);
              }}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleConfirmDeleteCareer}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {deleteLoading ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Career</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Skill Benchmark Modal */}
      <Modal
        isOpen={isEditSkillOpen}
        onClose={() => setIsEditSkillOpen(false)}
        title={`Edit Benchmark: ${editSkillForm.skill_name}`}
      >
        <form onSubmit={handleUpdateSkillReq} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Required Proficiency
            </label>
            <select
              value={editSkillForm.required_proficiency}
              onChange={(e) =>
                setEditSkillForm({ ...editSkillForm, required_proficiency: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Requirement Tier</label>
            <select
              value={editSkillForm.importance}
              onChange={(e) =>
                setEditSkillForm({ ...editSkillForm, importance: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="critical">Critical (Mandatory)</option>
              <option value="recommended">Recommended (Strong Plus)</option>
              <option value="optional">Optional (Elective)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditSkillOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Save Benchmark
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
