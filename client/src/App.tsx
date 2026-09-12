import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Pages
import { DashboardPage } from './pages/student/DashboardPage';
import { AdvisorPage } from './pages/student/AdvisorPage';
import { RoadmapPage } from './pages/student/RoadmapPage';
import { SkillGapPage } from './pages/student/SkillGapPage';
import { LearningPlanPage } from './pages/student/LearningPlanPage';
import { ResumeAnalyzerPage } from './pages/student/ResumeAnalyzerPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { StudentListPage } from './pages/admin/StudentListPage';
import { CourseManagementPage } from './pages/admin/CourseManagementPage';
import { CareerManagementPage } from './pages/admin/CareerManagementPage';

const AppContent: React.FC = () => {
  const { user, isLoading, isStudent, isAdmin } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Set default tab on login based on role
  useEffect(() => {
    if (isAdmin) {
      setCurrentTab('admin-dashboard');
    } else if (isStudent) {
      setCurrentTab('dashboard');
    }
  }, [isAdmin, isStudent]);

  const getTabTitle = (tab: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Student Dashboard',
      advisor: 'AI Academic Advisor',
      roadmap: 'Career Roadmap & Milestones',
      skillgap: 'Skill Gap Analysis Matrix',
      learningplan: 'Personalized Study Plan',
      resume: 'AI Resume Analyzer',
      profile: 'Academic Profile & Coursework',
      'admin-dashboard': 'Cohort Analytics Overview',
      'admin-students': 'Student Advisement Roster',
      'admin-courses': 'Course Catalog Administration',
      'admin-careers': 'Career Tracks & Benchmarks',
    };
    return titles[tab] || 'Dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Authenticating session and loading credentials..." size="lg" />
      </div>
    );
  }

  // Not authenticated: Auth Views
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full">
          {authView === 'login' ? (
            <LoginPage onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    );
  }

  // Authenticated Dashboard: True Side-by-Side Flex Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-indigo-500 selection:text-white">
      {/* Desktop Persistent Sidebar & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar
          currentTabTitle={getTabTitle(currentTab)}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Student Tabs */}
          {isStudent && (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />
              )}
              {currentTab === 'advisor' && <AdvisorPage />}
              {currentTab === 'roadmap' && <RoadmapPage />}
              {currentTab === 'skillgap' && <SkillGapPage />}
              {currentTab === 'learningplan' && <LearningPlanPage />}
              {currentTab === 'resume' && <ResumeAnalyzerPage />}
              {currentTab === 'profile' && <ProfilePage />}
            </>
          )}

          {/* Admin Tabs */}
          {isAdmin && (
            <>
              {currentTab === 'admin-dashboard' && (
                <AdminDashboardPage onNavigate={(tab) => setCurrentTab(tab)} />
              )}
              {currentTab === 'admin-students' && <StudentListPage />}
              {currentTab === 'admin-courses' && <CourseManagementPage />}
              {currentTab === 'admin-careers' && <CareerManagementPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
