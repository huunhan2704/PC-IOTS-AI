import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  RefreshCw,
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { iotService } from '@/services/iotService';
import { useCartStore } from '@/store/cartStore';
import { HealthScoreGauge } from '@/components/ai/HealthScoreGauge';
import { DiagnosisCard } from '@/components/ai/DiagnosisCard';
import { RecommendationCard } from '@/components/ai/RecommendationCard';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const frm_TuVanAI: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDeviceCode, setSelectedDeviceCode] = useState<string>('');
  const addItem = useCartStore((s) => s.addItem);

  const { data: devices = [] } = useQuery({
    queryKey: ['my-devices'],
    queryFn: iotService.getMyDevices,
  });

  React.useEffect(() => {
    if (devices.length > 0) {
      if (!selectedDeviceCode || !devices.some((d) => d.deviceCode === selectedDeviceCode)) {
        setSelectedDeviceCode(devices[0].deviceCode);
      }
    } else {
      setSelectedDeviceCode('');
    }
  }, [devices, selectedDeviceCode]);

  const { data: report, isLoading, isRefetching } = useQuery({
    queryKey: ['ai-diagnostics', selectedDeviceCode],
    queryFn: () => aiService.getDiagnostics(selectedDeviceCode),
    enabled: !!selectedDeviceCode,
  });

  const runMutation = useMutation({
    mutationFn: () => aiService.runDiagnostics(selectedDeviceCode),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-diagnostics', selectedDeviceCode], data);
      toast.success('Đã hoàn tất phân tích chuỗi log telemetry 30 ngày!');
    },
    onError: () => {
      toast.error('Không thể thực hiện chẩn đoán AI lúc này');
    },
  });

  const simulateMutation = useMutation({
    mutationFn: (scenario: string) => aiService.simulateBottleneck(selectedDeviceCode, scenario),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-diagnostics', selectedDeviceCode], data);
      toast.success('Đã nạp chuỗi telemetry mô phỏng và kích hoạt AI phát hiện điểm nghẽn!');
    },
    onError: () => {
      toast.error('Không thể nạp dữ liệu mô phỏng lúc này');
    },
  });

  const handleAddAllToCart = () => {
    if (!report?.recommendations || report.recommendations.length === 0) {
      toast.info('Hiện không có linh kiện nào được đề xuất');
      return;
    }

    report.recommendations.forEach((rec) => {
      addItem(rec.recommendedProduct, 1);
      aiService.markApplied(rec.id).catch(() => {});
    });

    toast.success(`Đã thêm tất cả ${report.recommendations.length} linh kiện đề xuất vào giỏ hàng!`);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
              Trợ Lý AI Chuẩn Đoán Phần Cứng & Gợi Ý Nâng Cấp
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ứng dụng thuật toán Rule-based Expert System kết hợp phân tích chuỗi thời gian telemetry (Moving Average, 95th Percentile) để phát hiện điểm nghẽn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDeviceCode}
            onChange={(e) => setSelectedDeviceCode(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            {devices.map((d) => (
              <option key={d.deviceCode} value={d.deviceCode}>
                {d.deviceName} ({d.deviceCode})
              </option>
            ))}
            {devices.length === 0 && <option value="">-- Chưa có thiết bị --</option>}
          </select>

          {/* Quick Simulation Dropdown for Defense Demo */}
          <div className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-indigo-300">Test AI:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  simulateMutation.mutate(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={simulateMutation.isPending}
              className="bg-slate-900/90 text-indigo-200 border border-indigo-500/40 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer hover:border-indigo-400 transition"
            >
              <option value="" disabled>-- Chọn kịch bản nghẽn --</option>
              <option value="RAM">💥 Mô phỏng Tràn RAM (&gt;90%)</option>
              <option value="CPU">⚠️ Mô phỏng Nghẽn CPU (&gt;95%)</option>
              <option value="THERMAL">🔥 Mô phỏng Quá nhiệt (&gt;88°C)</option>
              <option value="PSU">⚡ Mô phỏng Quá tải nguồn</option>
              <option value="ALL">🚨 Mô phỏng Tổng hợp (Đa nghẽn)</option>
              <option value="RESET">🔄 Xóa mô phỏng (Về máy gốc 100% Khỏe)</option>
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => runMutation.mutate()}
            isLoading={runMutation.isPending || isRefetching || simulateMutation.isPending}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Đo Đạc Thật
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>AI đang nạp và xử lý tập dữ liệu đo lường thời gian thực...</p>
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* 2. Health Score Card */}
          <HealthScoreGauge score={report.healthScore} />

          {/* Metrics summary banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Mẫu đo đã nạp</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{report.analyzedSamples} bản ghi</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Khoảng thời gian</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{report.periodDays} ngày qua</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Tần suất RAM &gt; 88%</span>
              <p className="font-mono font-bold text-amber-400 mt-0.5">
                {(report.metrics.ramOver88Ratio * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Nhiệt độ đỉnh CPU</span>
              <p className="font-mono font-bold text-rose-400 mt-0.5">{report.metrics.maxCpuTemp}°C</p>
            </div>
          </div>

          {/* 3. Findings list (Chẩn đoán bằng ngôn ngữ tự nhiên) */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Kết Luận Chuẩn Đoán Điểm Nghẽn Hệ Thống
            </h3>

            {report.findings.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p>
                  Tuyệt vời! Không phát hiện hiện tượng nghẽn cổ chai nghiêm trọng nào trên thiết bị này. Các linh kiện hoạt động đúng dải thông số kỹ thuật tiêu chuẩn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {report.findings.map((f, idx) => (
                  <DiagnosisCard
                    key={idx}
                    bottleneckType={f.bottleneckType}
                    severity={f.severity}
                    diagnosticText={f.diagnosticText}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 4. AI Recommendations list */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Đề Xuất Nâng Cấp Linh Kiện Tối Ưu Hóa (AI Upgrade Matrix)
              </h3>

              {report.recommendations.length > 0 && (
                <Button variant="primary" size="sm" onClick={handleAddAllToCart}>
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  1-Click Thêm Tất Cả Vào Giỏ Hàng
                </Button>
              )}
            </div>

            {report.recommendations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs text-center">
                Không có đề xuất linh kiện nâng cấp vào thời điểm này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {report.recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApply={() => aiService.markApplied(rec.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};
