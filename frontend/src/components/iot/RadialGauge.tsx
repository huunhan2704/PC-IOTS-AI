import React from 'react';

interface RadialGaugeProps {
  value: number;
  max?: number;
  title: string;
  unit: string;
  thresholds?: { warning: number; danger: number };
  subtitle?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max = 100,
  title,
  unit,
  thresholds = { warning: 70, danger: 85 },
  subtitle,
}) => {
  const clamped = Math.max(0, Math.min(max, value));
  const percentage = (clamped / max) * 100;

  // Gauge colors
  let strokeColor = '#10b981'; // emerald
  let textColor = 'text-emerald-400';
  let glowClass = '';

  if (value >= thresholds.danger) {
    strokeColor = '#f43f5e'; // rose
    textColor = 'text-rose-400';
    glowClass = 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]';
  } else if (value >= thresholds.warning) {
    strokeColor = '#f59e0b'; // amber
    textColor = 'text-amber-400';
    glowClass = 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]';
  }

  // SVG calculations for 220 degree arc
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  // Arc coverage: 240 degrees (out of 360)
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
        {title}
      </div>

      <div className="relative w-32 h-32 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-120" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-700 ease-out ${glowClass}`}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className={`text-2xl font-black tracking-tight ${textColor}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase">
            {unit}
          </span>
        </div>
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-400 font-medium text-center truncate max-w-full">
          {subtitle}
        </div>
      )}
    </div>
  );
};
