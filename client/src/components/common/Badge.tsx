import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
