import React from 'react';
import { Flame, Thermometer, Wind } from 'lucide-react';
import { AlertDto } from '@/types';

interface AlertBannerProps {
  statusFlag: string;
  recentAlert?: AlertDto | null;
  ambientTemp?: number;
  dustDensity?: number;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  statusFlag,
  ambientTemp = 0,
  dustDensity = 0,
}) => {
  // If current readings have returned to safe normal levels, do not display active alarm
  const isOverheat = statusFlag === 'ALERT_OVERHEAT';
  const isAmbientHeat = statusFlag === 'AMBIENT_HEAT' || ambientTemp >= 40.0;
  const isDustHigh = statusFlag === 'DUST_HIGH' || dustDensity >= 100.0;

  if (!isOverheat && !isAmbientHeat && !isDustHigh) return null;

  const title = isOverheat
    ? 'CẢNH BÁO NGUY HIỂM: QUÁ NHIỆT PHẦN CỨNG (BR09)'
    : isAmbientHeat
    ? 'CẢNH BÁO MÔI TRƯỜNG: NHIỆT ĐỘ PHÒNG QUÁ CAO (BR10)'
    : 'CẢNH BÁO BỤI TRONG CASE: ĐỀ NGHỊ VỆ SINH MÁY';

  const message = isOverheat
    ? 'Nhiệt độ CPU/GPU vượt ngưỡng 85°C liên tục 3 chu kỳ đo. Khuyến cáo kiểm tra tản nhiệt hoặc giảm tải hệ thống ngay lập tức.'
    : isAmbientHeat
    ? `Cảm biến ESP32 ghi nhận nhiệt độ môi trường ${ambientTemp}°C (>=40°C). Nguy cơ giảm tuổi thọ linh kiện máy tính.`
    : `Cảm biến bụi ESP32 ghi nhận mật độ bụi trong case đạt ${dustDensity} µg/m³ (>=100 µg/m³). Khách hàng nên vệ sinh case, quạt tản nhiệt và lưới lọc bụi để tránh nóng máy.`;

  return (
    <div
      className={`w-full p-4 rounded-2xl flex items-center gap-3.5 border animate-pulse ${
        isOverheat
          ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          : isAmbientHeat
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
          : 'bg-orange-500/15 border-orange-500/40 text-orange-200'
      }`}
    >
      <div
        className={`p-2 rounded-xl ${
          isOverheat
            ? 'bg-rose-500 text-white'
            : isAmbientHeat
            ? 'bg-amber-500 text-slate-950 font-bold'
            : 'bg-orange-500 text-slate-950 font-bold'
        }`}
      >
        {isOverheat ? (
          <Flame className="w-5 h-5" />
        ) : isAmbientHeat ? (
          <Thermometer className="w-5 h-5" />
        ) : (
          <Wind className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 text-xs sm:text-sm">
        <p className="font-extrabold uppercase tracking-wide">{title}</p>
        <p className="text-xs opacity-90 mt-0.5">{message}</p>
      </div>

      <div className="text-[11px] font-mono px-2 py-1 rounded bg-black/40 border border-white/10 shrink-0 hidden sm:block">
        ACTIVE ALARM
      </div>
    </div>
  );
};
