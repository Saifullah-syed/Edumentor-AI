import React, { useState, useEffect, useRef } from 'react';
import { resumeApi, studentApi } from '../../services/api';
import { ResumeAnalysis, Career } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  History,
  FileCheck,
  Award,
  ArrowRight,
  Code,
  ShieldCheck,
} from 'lucide-react';

export const ResumeAnalyzerPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<string>('Data Scientist');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await resumeApi.getHistory();
      if (res.data.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load resume history', err);
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
    fetchHistory();
    fetchCareers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
        setError('Please upload an industry-standard PDF document (.pdf). Other formats are not accepted.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.toLowerCase().endsWith('.pdf') && dropped.type !== 'application/pdf') {
        setError('Please upload an industry-standard PDF document (.pdf). Other formats are not accepted.');
        setFile(null);
        return;
      }
      setFile(dropped);
      setError(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a valid PDF resume (.pdf) first.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select an industry-standard PDF resume (.pdf).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('target_career', selectedCareer);

      const res = await resumeApi.uploadResume(formData);
      if (res.data.success && res.data.analysis) {
        setAnalysis(res.data.analysis);
        fetchHistory();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to analyze resume. Please ensure file contains legible text.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPastAnalysis = async (id: number) => {
    try {
      setLoading(true);
      const res = await resumeApi.getDetail(id);
      if (res.data.success) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.error('Failed to load analysis detail', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ATS Evaluation &amp; Career Alignment
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">Confidential Processing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Resume Analyzer &amp; Portfolio Strategist
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Upload your resume for real-time ATS scoring, keyword alignment against your target career, missing technical skills detection, and recommended capstone projects.
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleAnalyze} className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Role Benchmark
              </label>
              <select
                value={selectedCareer}
                onChange={(e) => setSelectedCareer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                The AI will evaluate keyword relevance against this benchmark.
              </p>
            </div>

            {/* Drag & Drop Box */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Resume Document (Official PDF format up to 5MB)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    {file ? <FileCheck className="w-5 h-5 text-emerald-400" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <div className="text-xs text-slate-300">
                    {file ? (
                      <span className="font-semibold text-emerald-300">
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <span>
                        <strong className="text-indigo-400">Click to upload</strong> or drag and drop your PDF resume
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Industry-standard PDF (.pdf) format supported</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'AI Parsing & Scoring Resume...' : 'Analyze Resume with AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <LoadingSpinner message="Extracting text, computing ATS compatibility, and generating tailored recommendations..." />
      )}

      {/* Analysis Results Display */}
      {analysis && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {(analysis.is_valid_resume === false || analysis.overall_score === 0) ? (
            /* Insufficient Resume Content Banner */
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-950/15">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                        Insufficient Resume Content
                      </span>
                      <span className="text-xs text-slate-400">Score: 0 / 100</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      Document Lacks Standard Resume Structure
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {analysis.summary ||
                        'The uploaded file does not contain enough recognizable resume sections (Education, Experience, Skills, Contact) or appears to be a declaration, certificate, or non-resume document. An ATS score cannot be authentically computed.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pillars required for a genuine resume */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Required Resume Pillars</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                      <span className="text-indigo-400 font-bold text-sm">1</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Contact & Header</h4>
                        <p className="text-[11px] text-slate-400">Full Name, professional email, phone number, and LinkedIn / GitHub profile link.</p>
                      </div>
                    </li>
                    <li className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                      <span className="text-indigo-400 font-bold text-sm">2</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Educational Background</h4>
                        <p className="text-[11px] text-slate-400">Degree, university name, graduation date/range, relevant courses, and GPA.</p>
                      </div>
                    </li>
                    <li className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                      <span className="text-indigo-400 font-bold text-sm">3</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Professional / Project Experience</h4>
                        <p className="text-[11px] text-slate-400">Job titles, organizations, and bullet points describing achievements with action verbs and metrics.</p>
                      </div>
                    </li>
                    <li className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3">
                      <span className="text-indigo-400 font-bold text-sm">4</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Technical & Tool Skills</h4>
                        <p className="text-[11px] text-slate-400">Categorized proficiencies in languages, frameworks, developer tools, and domain concepts.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Next Steps to Fix Your Document</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(analysis.recommendations && analysis.recommendations.length > 0
                      ? analysis.recommendations
                      : [
                          'Export your resume directly from Google Docs, Word, or LaTeX as a text-searchable PDF.',
                          'Ensure standard section headers are used (e.g., "Education", "Experience", "Skills", "Projects").',
                          'Do not upload scans or image-only documents without embedded digital text.',
                          'Do not upload single-purpose declaration forms, certificates, or admission slips in place of a full resume.',
                        ]
                    ).map((rec, idx) => (
                      <li key={idx} className="text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 leading-relaxed">
                        <span className="font-semibold text-amber-300">Step {idx + 1}: </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Normal Valid Resume Display */
            <>
              {/* Score Cards Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Overall ATS Score
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-emerald-400">
                      {analysis.overall_score}
                    </span>
                    <span className="text-base text-slate-500">/ 100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Formatting, clarity, and keyword density
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-purple-950/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Career Alignment
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-indigo-400">
                      {analysis.career_alignment_score}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Targeted fit for {selectedCareer} roles
                  </p>
                </div>

                <div className="sm:col-span-2 lg:col-span-1 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Recruiter Executive Summary
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{analysis.summary}"
                  </p>
                </div>
              </div>

              {/* Detailed Strengths & Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Demonstrated Strengths</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(analysis.strengths || []).map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Weaknesses & Missing Skills */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Identified Weaknesses &amp; Missing Keywords</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Missing Skills for {selectedCareer}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(analysis.missing_skills || []).map((ms, idx) => (
                        <Badge key={idx} variant="warning" size="sm">
                          {ms}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Areas Needing Refinement:
                      </p>
                      {(analysis.weaknesses || []).map((w, idx) => (
                        <p key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          <span>{w}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Improvements & Recommended Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Suggested Improvements */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Actionable Resume Revisions</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {(analysis.recommendations || []).map((r, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 leading-relaxed"
                      >
                        <span className="font-semibold text-indigo-300">Action {idx + 1}: </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Projects to Build */}
                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Recommended Portfolio Projects</h3>
                  </div>
                  <div className="space-y-3">
                    {(analysis.recommended_projects || []).map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                      >
                        <h4 className="text-xs font-bold text-white">{proj.title}</h4>
                        <p className="text-xs text-slate-300">{proj.description}</p>
                        <p className="text-[10px] text-indigo-300">
                          <strong>Tech Stack: </strong>
                          {proj.tech_stack}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Past Analyses Drawer / List */}
      {history.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Past Resume Evaluations
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => handleLoadPastAnalysis(h.id)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-white truncate">{h.filename}</p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>Score: <strong className={Number(h.overall_score) > 0 ? "text-emerald-400" : "text-rose-400"}>{h.overall_score}/100</strong></span>
                  <span>{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
