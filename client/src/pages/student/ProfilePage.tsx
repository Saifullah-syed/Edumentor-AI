import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api';
import { StudentProfile, Course, Skill, Career } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  GraduationCap,
  BookOpen,
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  Award,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { updateLocalProfile, broadcastProfileUpdate } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  // Form states for modals
  const [newCourseId, setNewCourseId] = useState<number | ''>('');
  const [newCourseGrade, setNewCourseGrade] = useState('A');
  const [newCourseStatus, setNewCourseStatus] = useState('completed');

  const [newSkillId, setNewSkillId] = useState<number | ''>('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('Intermediate');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, carRes, crsRes, sklRes] = await Promise.all([
        studentApi.getProfile(),
        studentApi.getCareers(),
        studentApi.getAvailableCourses(),
        studentApi.getAvailableSkills(),
      ]);

      if (pRes.data.success) {
        setProfile(pRes.data.profile);
        setCourses(pRes.data.profile.courses || []);
        setSkills(pRes.data.profile.skills || []);
      }
      if (carRes.data.success) setAllCareers(carRes.data.careers || []);
      if (crsRes.data.success) setAllCourses(crsRes.data.courses || []);
      if (sklRes.data.success) setAllSkills(sklRes.data.skills || []);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileChange = (field: string, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Frontend validation
    const parsedGpa = parseFloat(String(profile.gpa));
    if (isNaN(parsedGpa) || parsedGpa < 0 || parsedGpa > 10.0) {
      setErrorMsg('Cumulative GPA must be between 0.0 and 10.0.');
      return;
    }

    const parsedYear = parseInt(String(profile.graduation_year), 10);
    if (isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2035) {
      setErrorMsg('Please select a valid graduation year between 2020 and 2035.');
      return;
    }

    const parsedProg = parseFloat(String(profile.academic_progress));
    if (isNaN(parsedProg) || parsedProg < 0 || parsedProg > 100) {
      setErrorMsg('Academic progress must be between 0% and 100%.');
      return;
    }

    setSaving(true);
    try {
      const res = await studentApi.updateProfile({
        university: profile.university,
        program: profile.program,
        degree: profile.degree,
        graduation_year: parsedYear,
        gpa: parsedGpa,
        academic_progress: parsedProg,
        target_career_id: profile.target_career_id,
      });

      if (res.data.success) {
        if (res.data.profile) {
          setProfile(res.data.profile);
          updateLocalProfile(res.data.profile);
        } else {
          broadcastProfileUpdate();
        }
        setSuccessMsg('Academic profile updated and synchronized successfully!');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId) return;
    try {
      await studentApi.addCourse({
        course_id: newCourseId,
        grade: newCourseGrade,
        status: newCourseStatus,
      });
      setIsAddCourseOpen(false);
      await loadData();
      broadcastProfileUpdate();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add course.');
    }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await studentApi.deleteCourse(id);
      await loadData();
      broadcastProfileUpdate();
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillId) return;
    try {
      await studentApi.addSkill({
        skill_id: newSkillId,
        proficiency: newSkillProficiency,
      });
      setIsAddSkillOpen(false);
      await loadData();
      broadcastProfileUpdate();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add skill.');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      await studentApi.deleteSkill(id);
      await loadData();
      broadcastProfileUpdate();
    } catch (err) {
      console.error('Failed to delete skill', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading academic credentials &amp; profile..." />;
  if (!profile) return <div className="p-6 text-center text-slate-400">Profile not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Profile Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Academic Record &amp; Portfolio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Student Profile &amp; Coursework
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Maintain your official university program details, enrolled coursework, and verified skill set.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Academic Details Form */}
        <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">University</label>
              <input
                type="text"
                required
                value={profile.university}
                onChange={(e) => handleProfileChange('university', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Program</label>
              <input
                type="text"
                required
                value={profile.program}
                onChange={(e) => handleProfileChange('program', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Degree Type</label>
              <input
                type="text"
                required
                value={profile.degree}
                onChange={(e) => handleProfileChange('degree', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Graduation Year</label>
              <select
                value={profile.graduation_year || 2026}
                onChange={(e) => handleProfileChange('graduation_year', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {Array.from({ length: 16 }, (_, i) => 2020 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cumulative GPA <span className="text-slate-400 font-normal">(0.0 – 10.0)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10.0"
                required
                value={profile.gpa}
                onChange={(e) => handleProfileChange('gpa', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={profile.academic_progress}
                onChange={(e) => handleProfileChange('academic_progress', Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Career Goal</label>
              <select
                value={profile.target_career_id || ''}
                onChange={(e) => handleProfileChange('target_career_id', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {allCareers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Academic Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Courses Management Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">University Coursework</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed, in-progress, and planned departmental courses
            </p>
          </div>
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{c.code}</td>
                  <td className="py-3 px-4">{c.title}</td>
                  <td className="py-3 px-4">{c.credits}</td>
                  <td className="py-3 px-4">{c.department}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-300">{c.grade || '—'}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        c.status === 'completed'
                          ? 'success'
                          : c.status === 'in_progress'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skills Management Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Verified Skills &amp; Proficiencies</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Technical, analytical, and professional competencies evaluated by the advisor
            </p>
          </div>
          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Skill</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
            >
              <div>
                <h3 className="text-xs font-bold text-white">{s.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-indigo-400 font-semibold">{s.proficiency}</span>
                  <span className="text-[10px] text-slate-500">({s.category})</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteSkill(s.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                title="Remove skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} title="Add Course to Record">
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Course</label>
            <select
              value={newCourseId}
              onChange={(e) => setNewCourseId(Number(e.target.value))}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Course from Catalog --</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title} ({c.credits} Credits, {c.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Grade</label>
              <select
                value={newCourseGrade}
                onChange={(e) => setNewCourseGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="A">A (4.0)</option>
                <option value="A-">A- (3.7)</option>
                <option value="B+">B+ (3.3)</option>
                <option value="B">B (3.0)</option>
                <option value="B-">B- (2.7)</option>
                <option value="C+">C+ (2.3)</option>
                <option value="C">C (2.0)</option>
                <option value="In Progress">In Progress (N/A)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enrollment Status</label>
              <select
                value={newCourseStatus}
                onChange={(e) => setNewCourseStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="planned">Planned (Next Semester)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddCourseOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newCourseId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Save Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Skill Modal */}
      <Modal isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} title="Add Skill to Profile">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Skill</label>
            <select
              value={newSkillId}
              onChange={(e) => setNewSkillId(Number(e.target.value))}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Skill from Taxonomy --</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Proficiency</label>
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner (Foundational)</option>
              <option value="Intermediate">Intermediate (Project-ready)</option>
              <option value="Advanced">Advanced (Production mastery)</option>
            </select>
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
              disabled={!newSkillId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Save Skill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
