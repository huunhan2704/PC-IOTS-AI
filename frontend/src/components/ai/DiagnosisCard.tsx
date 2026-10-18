import React from 'react';
import { MemoryStick, Cpu, Flame, PlugZap, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface DiagnosisCardProps {
  bottleneckType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  diagnosticText: string;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  bottleneckType,
  severity,
  diagnosticText,
}) => {
  const getIcon = () => {
    switch (bottleneckType) {
      case 'RAM_EXHAUSTION':
        return <MemoryStick className="w-5 h-5 text-indigo-400" />;
      case 'CPU_BOTTLENECK':
        return <Cpu className="w-5 h-5 text-sky-400" />;
      case 'THERMAL_THROTTLING':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'PSU_INSUFFICIENT':
        return <PlugZap className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger">NGHIÊM TRỌNG</Badge>;
      case 'HIGH':
        return <Badge variant="danger">MỨC CAO</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">TRUNG BÌNH</Badge>;
      default:
        return <Badge variant="info">MỨC THẤP</Badge>;
    }
  };

  const getTitle = () => {
    switch (bottleneckType) {
      case 'RAM_EXHAUSTION':
        return 'Phát hiện Nghẽn Tràn RAM (RAM Exhaustion - BR11)';
      case 'CPU_BOTTLENECK':
        return 'Phát hiện Nghẽn Cổ Chai Vi Xử Lý (CPU Bottleneck - BR12)';
      case 'GPU_BOTTLENECK':
        return 'Phát hiện Nghẽn Card Màn Hình (GPU Bottleneck)';
      case 'THERMAL_THROTTLING':
        return 'Phát hiện Suy Giảm Tản Nhiệt (Thermal Throttling - BR13)';
      case 'PSU_INSUFFICIENT':
        return 'Nguy Cơ Quá Tải Bộ Nguồn (PSU Safety Margin - BR03)';
      default:
        return `Hiện tượng: ${bottleneckType}`;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            {getIcon()}
          </div>
          <h4 className="text-sm font-bold text-slate-100">{getTitle()}</h4>
        </div>
        {getSeverityBadge()}
      </div>

      <p className="text-xs text-slate-300 leading-relaxed pl-11 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
        {diagnosticText}
      </p>
    </div>
  );
};
