import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { CompatibilityReport } from '@/types';
import { PriceTag } from '@/components/ui/PriceTag';

interface CompatibilityBoxProps {
  report: CompatibilityReport | null;
  totalPrice: number;
  totalTdp: number;
  recommendedPsu: number;
  selectedPsuWattage?: number;
}

export const CompatibilityBox: React.FC<CompatibilityBoxProps> = ({
  report,
  totalPrice,
  totalTdp,
  recommendedPsu,
  selectedPsuWattage,
}) => {
  const isCompatible = report?.compatible ?? true;
  const issues = report?.issues || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
      {/* Compatibility Badge Status */}
      <div
        className={`p-4 rounded-xl flex items-start gap-3.5 border ${
          isCompatible
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}
      >
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isCompatible ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-rose-500 text-white'
          }`}
        >
          {isCompatible ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide">
            {isCompatible
              ? 'TẤT CẢ LINH KIỆN TƯƠNG THÍCH 100%'
              : 'PHÁT HIỆN XUNG ĐỘT KỸ THUẬT PHẦN CỨNG'}
          </h4>
          <p className="text-xs opacity-90 mt-0.5">
            {isCompatible
              ? 'Cấu hình hoàn toàn chuẩn chỉ về Socket, chuẩn RAM, công suất nguồn và kích thước lắp đặt.'
              : 'Có linh kiện không tương thích hoặc công suất nguồn không an toàn, vui lòng điều chỉnh.'}
          </p>
        </div>
      </div>

      {/* Issues list if any */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            Chi tiết lỗi tương thích:
          </h5>
          <div className="space-y-1.5">
            {issues.map((err, idx) => (
              <div
                key={idx}
                className="text-xs p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2"
              >
                <span className="font-mono font-bold bg-rose-500/20 px-1.5 py-0.5 rounded text-[10px]">
                  {err.rule}
                </span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TDP & PSU Metric Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Tổng Công Suất Tiêu Thụ (TDP)
            </span>
            <span className="font-mono font-bold text-slate-200 text-sm">{totalTdp}W</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Bao gồm CPU, GPU và tải nền bo mạch, quạt, ổ cứng
          </p>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Nguồn Đề Xuất (BR03: ≥125%)
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">≥ {recommendedPsu}W</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {selectedPsuWattage
              ? `Nguồn đã chọn: ${selectedPsuWattage}W ${
                  selectedPsuWattage >= recommendedPsu ? '✅ An toàn' : '❌ Quá tải'
                }`
              : 'Chưa chọn bộ nguồn'}
          </p>
        </div>
      </div>

      {/* Total Price Section */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Tổng Chi Phí Bộ Máy
          </span>
          <PriceTag price={totalPrice} size="xl" />
        </div>
      </div>
    </div>
  );
};
