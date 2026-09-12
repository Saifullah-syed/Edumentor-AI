import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  Search,
  Eye,
  GraduationCap,
  BookOpen,
  Award,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStudents({ search });
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load student roster', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleInspectStudent = async (profileId: number) => {
    try {
      setDetailLoading(true);
      setIsDetailOpen(true);
      const res = await adminApi.getStudentDetail(profileId);
      if (res.data.success) {
        setSelectedStudent(res.data.student);
      }
    } catch (err) {
      console.error('Failed to inspect student', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Cohort Telemetry
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              Student Advisement Roster
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Inspect student coursework trajectories, degree completion percentages, and skill benchmarks.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        {loading ? (
          <LoadingSpinner message="Filtering student roster..." />
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No student accounts matching query "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">University &amp; Program</th>
                  <th className="py-3 px-4">GPA</th>
                  <th className="py-3 px-4">Academic Progress</th>
                  <th className="py-3 px-4">Target Career</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s) => (
                  <tr key={s.profile_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{s.program}</div>
                      <div className="text-[10px] text-slate-400">{s.degree}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {s.gpa ? s.gpa.toFixed(2) : '3.50'}
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <ProgressBar
                        value={s.academic_progress || 0}
                        max={100}
                        color="indigo"
                        size="sm"
                        showPercent={true}
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="primary" size="sm">
                        {s.target_career_title || 'Undecided'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspectStudent(s.profile_id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedStudent ? `Advisement Dossier: ${selectedStudent.name}` : 'Student Profile'}
        maxWidth="xl"
      >
        {detailLoading || !selectedStudent ? (
          <LoadingSpinner message="Retrieving student dossier..." />
        ) : (
          <div className="space-y-6 text-xs">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-400">Program</span>
                <p className="font-bold text-white mt-0.5">{selectedStudent.program}</p>
              </div>
              <div>
                <span className="text-slate-400">Cumulative GPA</span>
                <p className="font-bold text-emerald-400 mt-0.5">{selectedStudent.gpa?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">Degree Progress</span>
                <p className="font-bold text-indigo-400 mt-0.5">{selectedStudent.academic_progress}%</p>
              </div>
              <div>
                <span className="text-slate-400">Target Career</span>
                <p className="font-bold text-purple-300 mt-0.5">
                  {selectedStudent.target_career_title || 'Undecided'}
                </p>
              </div>
            </div>

            {/* Course History */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Enrolled &amp; Completed Coursework</span>
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(selectedStudent.courses || []).map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white mr-2">{c.code}:</span>
                      <span className="text-slate-300">{c.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-400">{c.grade || '—'}</span>
                      <Badge variant={c.status === 'completed' ? 'success' : 'warning'} size="sm">
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Verified Skills */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Verified Skills &amp; Proficiencies</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedStudent.skills || []).map((s: any) => (
                  <span
                    key={s.id}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                  >
                    {s.name} <strong className="text-indigo-400 font-bold">({s.proficiency})</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
