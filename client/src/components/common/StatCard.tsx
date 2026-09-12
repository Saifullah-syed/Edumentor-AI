import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  accentColor = 'indigo',
}) => {
  const iconGradients = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20',
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className={trendPositive ? 'text-emerald-400' : 'text-amber-400'}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br border ${iconGradients[accentColor]} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
