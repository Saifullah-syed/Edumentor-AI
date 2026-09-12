import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Compass,
  Target,
  CalendarCheck,
  FileText,
  GraduationCap,
  Users,
  BookOpen,
  Briefcase,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
}) => {
  const { isStudent, isAdmin } = useAuth();

  const studentNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'advisor', label: 'AI Advisor', icon: MessageSquare, badge: 'AI' },
    { id: 'roadmap', label: 'Career Roadmap', icon: Compass },
    { id: 'skillgap', label: 'Skill Gap Analysis', icon: Target },
    { id: 'learningplan', label: 'Learning Plan', icon: CalendarCheck, badge: 'AI' },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText, badge: 'AI' },
    { id: 'profile', label: 'Profile & Academics', icon: GraduationCap },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Analytics Overview', icon: LayoutDashboard },
    { id: 'admin-students', label: 'Students Roster', icon: Users },
    { id: 'admin-courses', label: 'Course Catalog', icon: BookOpen },
    { id: 'admin-careers', label: 'Careers & Benchmarks', icon: Briefcase },
  ];

  const items = isAdmin ? adminNavItems : studentNavItems;

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800/80 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">EduMentor AI</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Academic &amp; Career Advisor</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Heading */}
        <div className="px-2.5 py-1.5 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Administrative Portal' : 'Student Navigation'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Advisor Pill Footer */}
      <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            {isAdmin ? 'Advisor Mode' : 'AI-Assisted Guidance'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          {isAdmin
            ? 'RBAC Protected: Faculty and Advisor Administrative clearance.'
            : 'Personalized using your degree coursework, verified skills, and career target.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 p-4 shadow-2xl z-50 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 p-4 z-20">
        {sidebarContent}
      </aside>
    </>
  );
};
