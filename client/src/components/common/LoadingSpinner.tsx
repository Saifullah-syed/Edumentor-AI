import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading EduMentor AI data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin`}
      />
      {message && <p className="text-xs text-slate-400 animate-pulse">{message}</p>}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center border border-slate-800">
      {icon && <div className="text-slate-500 mb-3">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
