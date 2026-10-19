import React from 'react';
import { AlertOctagon, Flame, Thermometer } from 'lucide-react';
import { AlertDto } from '@/types';

interface AlertBannerProps {
  statusFlag: string;
  recentAlert?: AlertDto | null;
  ambientTemp?: number;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  statusFlag,
  recentAlert,
  ambientTemp = 0,
}) => {
  // If current readings have returned to safe normal levels, do not display active alarm
  const isOverheat = statusFlag === 'ALERT_OVERHEAT';
  const isAmbientHeat = statusFlag === 'AMBIENT_HEAT' || ambientTemp >= 40.0;

  if (!isOverheat && !isAmbientHeat) return null;

  return (
    <div
      className={`w-full p-4 rounded-2xl flex items-center gap-3.5 border animate-pulse ${
        isOverheat
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
      }`}
    >
      <div
        className={`p-2 rounded-xl ${
          isOverheat ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950 font-bold'
        }`}
      >
        {isOverheat ? <Flame className="w-5 h-5" /> : <Thermometer className="w-5 h-5" />}
      </div>

      <div className="flex-1 text-xs sm:text-sm">
        <p className="font-extrabold uppercase tracking-wide">
          {isOverheat
            ? 'CẢNH BÁO NGUY HIỂM: QUÁ NHIỆT PHẦN CỨNG (BR09)'
            : 'CẢNH BÁO MÔI TRƯỜNG: NHIỆT ĐỘ PHÒNG QUÁ CAO (BR10)'}
        </p>
        <p className="text-xs opacity-90 mt-0.5">
          {isOverheat
            ? 'Nhiệt độ CPU/GPU vượt ngưỡng 85°C liên tục 3 chu kỳ đo. Khuyến cáo kiểm tra tản nhiệt hoặc giảm tải hệ thống ngay lập tức.'
            : `Cảm biến ESP32 ghi nhận nhiệt độ môi trường ${ambientTemp}°C (>40°C). Nguy cơ giảm tuổi thọ linh kiện máy tính.`}
        </p>
      </div>

      <div className="text-[11px] font-mono px-2 py-1 rounded bg-black/40 border border-white/10 shrink-0 hidden sm:block">
        ACTIVE ALARM
      </div>
    </div>
  );
};
