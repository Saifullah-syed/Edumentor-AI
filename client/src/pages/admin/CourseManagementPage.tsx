import React, { useState, useEffect } from 'react';
import { adminApi, studentApi } from '../../services/api';
import { Course } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BookOpen, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export const CourseManagementPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    credits: 3,
    department: 'Computer Science',
    difficulty_level: 'Intermediate',
    semester_offered: 'Fall & Spring',
    description: '',
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getAvailableCourses();
      if (res.data.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      credits: 3,
      department: 'Computer Science',
      difficulty_level: 'Intermediate',
      semester_offered: 'Fall & Spring',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      credits: course.credits,
      department: course.department,
      difficulty_level: course.difficulty_level,
      semester_offered: course.semester_offered || 'Fall & Spring',
      description: course.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, formData);
      } else {
        await adminApi.createCourse(formData);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error('Failed to save course', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this course from the university catalog?')) return;
    try {
      await adminApi.deleteCourse(id);
      fetchCourses();
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Curriculum Administration
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              University Course Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add, update, or archive accredited courses across departments.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {/* Courses Catalog Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        {loading ? (
          <LoadingSpinner message="Loading course catalog..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{c.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{c.title}</div>
                      {c.description && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-300">{c.credits}</td>
                    <td className="py-3.5 px-4">{c.department}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.difficulty_level === 'Beginner'
                            ? 'success'
                            : c.difficulty_level === 'Intermediate'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {c.difficulty_level}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{c.semester_offered || 'All'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit course"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.code}` : 'Add Course to Catalog'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS450"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Distributed Cloud Systems"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Computer Science"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief course objectives and syllabus coverage..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
