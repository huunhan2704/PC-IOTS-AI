import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    info: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
