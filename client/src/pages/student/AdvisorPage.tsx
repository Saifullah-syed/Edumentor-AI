import React, { useState, useEffect, useRef } from 'react';
import { advisorApi, supportApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { AiChatMessage } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Send,
  Sparkles,
  Trash2,
  AlertTriangle,
  Bot,
  User,
  HelpCircle,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export const AdvisorPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Human Advisor Consultation State
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    topic: 'Graduation Credit Audit & Course Planning',
    message: '',
  });
  const [consultSubmitting, setConsultSubmitting] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState<string | null>(null);
  const [consultError, setConsultError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setConsultForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultError(null);
    setConsultSuccess(null);
    setConsultSubmitting(true);
    try {
      const res = await supportApi.submitRequest(consultForm);
      if (res.data.success) {
        setConsultSuccess(res.data.message || 'Advising consultation ticket generated successfully.');
        setConsultForm((prev) => ({ ...prev, message: '' }));
      }
    } catch (err: any) {
      setConsultError(
        err.response?.data?.message || 'Failed to submit advising consultation request.'
      );
    } finally {
      setConsultSubmitting(false);
    }
  };

  const fetchConversation = async () => {
    try {
      setInitialLoading(true);
      const res = await advisorApi.getConversation();
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setSuggestedQuestions(
          res.data.suggestedQuestions || [
            'What courses should I take next semester?',
            'What skills do I need to become a data scientist?',
            'What should I learn after Python?',
            'What projects should I build for a machine learning career?',
            'How can I improve my academic progress and GPA?',
          ]
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversation.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setError(null);
    setInput('');

    // Optimistically add user message
    const tempUserMsg: AiChatMessage = {
      id: Date.now(),
      conversation_id: 1,
      sender: 'user',
      content: text,
      disclaimer_shown: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await advisorApi.sendMessage(text);
      if (res.data.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to receive AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear your advising conversation history?')) return;
    try {
      await advisorApi.clearConversation();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear conversation');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] glass-panel rounded-3xl border border-slate-800 overflow-hidden">
      {/* Advisor Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                AI Academic &amp; Career Advisor
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Context
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized with your courses, skills, and target career
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConsultError(null);
              setConsultSuccess(null);
              setIsConsultModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Consult Human Advisor</span>
            <span className="sm:hidden">Human Advisor</span>
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsible AI Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="text-[11px]">
            <strong>Responsible AI Notice:</strong> Recommendations are AI-generated based on your profile. Important graduation audits and course registration requirements should always be confirmed with your official university department advisor.
          </span>
        </div>
        <button
          onClick={() => {
            setConsultError(null);
            setConsultSuccess(null);
            setIsConsultModalOpen(true);
          }}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0 cursor-pointer text-left"
        >
          Book Consultation →
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {initialLoading ? (
          <LoadingSpinner message="Loading advising session history..." />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">How can I guide your academics today?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              I have direct context of your completed courses, current skills, and target career goal. Ask me anything or select a prompt below.
            </p>

            <div className="w-full space-y-2 text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
                Suggested Inquiries:
              </p>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isAi
                      ? 'glass-card border border-slate-800/80 text-slate-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {/* Clean Markdown rendered text */}
                  <div className="whitespace-pre-wrap font-normal">{m.content}</div>

                  <span className="block text-[10px] text-slate-400 mt-2 text-right">
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-2">EduMentor AI is formulating advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips (when conversation is active) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto flex gap-2 no-scrollbar">
          {suggestedQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 whitespace-nowrap transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/60">
        {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask your academic &amp; career advisor anything..."
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Human Advisor Consultation Modal */}
      <Modal
        isOpen={isConsultModalOpen}
        onClose={() => {
          if (!consultSubmitting) {
            setIsConsultModalOpen(false);
            setConsultSuccess(null);
            setConsultError(null);
          }
        }}
        title="Official Academic Advisor Consultation"
      >
        {consultSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Consultation Request Dispatched</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{consultSuccess}</p>
              <p className="text-[11px] text-slate-500 mt-2">
                A university department advisor will contact you within 1-2 business days with confirmed audit records.
              </p>
            </div>
            <button
              onClick={() => {
                setIsConsultModalOpen(false);
                setConsultSuccess(null);
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleConsultSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with an official university department academic counselor for certified degree audits, transfer credits, and graduation clearance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={consultForm.name}
                  onChange={(e) => setConsultForm({ ...consultForm, name: e.target.value })}
                  placeholder="e.g. Saifullah"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">University Email</label>
                <input
                  type="email"
                  required
                  value={consultForm.email}
                  onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })}
                  placeholder="student@university.edu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Advising Department / Topic</label>
              <select
                value={consultForm.topic}
                onChange={(e) => setConsultForm({ ...consultForm, topic: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Graduation Credit Audit & Course Planning">Graduation Credit Audit & Course Planning</option>
                <option value="Degree Requirement Exception / Petition">Degree Requirement Exception / Petition</option>
                <option value="Career Pathway Transition Advising">Career Pathway Transition Advising</option>
                <option value="Internship / Capstone Prerequisite Review">Internship / Capstone Prerequisite Review</option>
                <option value="Academic Standing & Grade Improvement">Academic Standing & Grade Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Specific Inquiries or Questions
              </label>
              <textarea
                rows={4}
                required
                value={consultForm.message}
                onChange={(e) => setConsultForm({ ...consultForm, message: e.target.value })}
                placeholder="Explain the specific courses, audit questions, or scheduling constraints you want to address with an advisor..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {consultError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{consultError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                disabled={consultSubmitting}
                onClick={() => {
                  setIsConsultModalOpen(false);
                  setConsultError(null);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={consultSubmitting || !consultForm.message.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {consultSubmitting ? 'Dispatching Ticket...' : 'Submit Consultation Ticket'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
