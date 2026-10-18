import React from 'react';
import { Fan } from 'lucide-react';

interface FanSpeedGaugeProps {
  rpm: number;
  maxRpm?: number;
}

export const FanSpeedGauge: React.FC<FanSpeedGaugeProps> = ({ rpm, maxRpm = 2600 }) => {
  const percentage = Math.min(100, Math.round((rpm / maxRpm) * 100));

  // Determine spinning duration: from 2s (idle) down to 0.2s (max load)
  const animDuration = percentage > 0 ? Math.max(0.15, 2 - (percentage / 100) * 1.8) : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between hover:border-slate-700 transition">
      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center">
        Tốc Độ Quạt (Fan RPM)
      </div>

      <div className="relative my-3 flex flex-col items-center justify-center">
        <div className="p-4 rounded-full bg-slate-950/70 border border-slate-800 shadow-inner">
          <Fan
            className="w-12 h-12 text-sky-400"
            style={{
              animation: animDuration > 0 ? `spin ${animDuration}s linear infinite` : 'none',
            }}
          />
        </div>

        <div className="mt-2 text-center">
          <span className="text-2xl font-black text-sky-400 font-mono tracking-tight">
            {rpm}
          </span>
          <span className="text-xs text-slate-400 font-semibold ml-1">RPM</span>
        </div>
      </div>

      <div className="w-full space-y-1">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Công suất quạt</span>
          <span className="font-semibold text-slate-200">{percentage}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
