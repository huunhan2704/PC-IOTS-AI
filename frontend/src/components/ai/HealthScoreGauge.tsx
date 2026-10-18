import React from 'react';

interface HealthScoreGaugeProps {
  score: number;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ score }) => {
  let label = 'TỐT (HEALTHY)';
  let color = '#10b981'; // emerald
  let textColor = 'text-emerald-400';
  let desc = 'Hệ thống hoạt động ổn định, tải phân bổ đồng đều.';

  if (score < 50) {
    label = 'NGUY HIỂM (CRITICAL)';
    color = '#f43f5e';
    textColor = 'text-rose-400';
    desc = 'Phát hiện quá nhiệt hoặc nghẽn cổ chai nghiêm trọng.';
  } else if (score < 75) {
    label = 'CẦN CHÚ Ý (WARNING)';
    color = '#f59e0b';
    textColor = 'text-amber-400';
    desc = 'Có hiện tượng tràn RAM hoặc nhiệt độ tiệm cận ngưỡng.';
  } else if (score < 90) {
    label = 'KHÁ (FAIR)';
    color = '#38bdf8';
    textColor = 'text-sky-400';
    desc = 'Hệ thống đáp ứng tốt hầu hết tác vụ hàng ngày.';
  }

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
          />
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black font-mono tracking-tight ${textColor}`}>
            {score}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">/ 100 ĐIỂM</span>
        </div>
      </div>

      <div className="space-y-1.5 text-center md:text-left">
        <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-slate-800 border border-slate-700">
          <span className={textColor}>{label}</span>
        </div>
        <h3 className="text-base font-extrabold text-slate-100">
          Điểm Số Sức Khỏe Phần Cứng (Hardware Health Score)
        </h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};
