import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Sparkles, Menu } from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  currentTabTitle?: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTabTitle = 'Dashboard', onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-10 w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left side: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile mini brand */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">EduMentor AI</span>
        </div>

        {/* Desktop Breadcrumb / Active Page Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-slate-400">EduMentor AI</span>
          <span className="text-slate-600">/</span>
          <span className="font-bold text-white text-sm">{currentTabTitle}</span>
        </div>
      </div>

      {/* Right side: User info & logout */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {user && (
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
            <Badge
              variant={isAdmin ? 'primary' : 'success'}
              size="sm"
              className="capitalize hidden sm:inline-flex ml-1"
            >
              {user.role}
            </Badge>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          title="Sign out of your account"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
