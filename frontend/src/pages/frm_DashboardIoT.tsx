import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Plus,
  Wifi,
  WifiOff,
  Thermometer,
  Droplets,
  Zap,
  Clock,
  Laptop,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { iotService } from '@/services/iotService';
import { useStompTopic } from '@/hooks/useStomp';
import { DeviceDto, Scenario, TelemetryDto, AlertDto } from '@/types';
import { RadialGauge } from '@/components/iot/RadialGauge';
import { FanSpeedGauge } from '@/components/iot/FanSpeedGauge';
import { AlertBanner } from '@/components/iot/AlertBanner';
import { SimulationControls } from '@/components/iot/SimulationControls';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export const frm_DashboardIoT: React.FC = () => {
  const [selectedDeviceCode, setSelectedDeviceCode] = useState<string>('PC-NHAN-001');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('');

  // Live telemetry state
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryDto>({
    deviceCode: 'PC-NHAN-001',
    cpuLoad: 25.4,
    cpuTemp: 52.1,
    cpuClockMhz: 4200,
    ramUsage: 68.5,
    ramUsedGb: 10.96,
    ramTotalGb: 16.0,
    gpuLoad: 12.0,
    gpuTemp: 48.0,
    fanSpeedRpm: 1250,
    powerDrawW: 180,
    ambientTemp: 28.5,
    ambientHumidity: 62.0,
    statusFlag: 'NORMAL',
    recordedAt: new Date().toISOString(),
  });

  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertDto | null>(null);

  // Load devices
  const { data: devices = [], refetch: refetchDevices } = useQuery({
    queryKey: ['my-devices'],
    queryFn: iotService.getMyDevices,
  });

  // Load initial telemetry history
  useEffect(() => {
    if (selectedDeviceCode) {
      iotService
        .getTelemetryHistory(selectedDeviceCode, 30)
        .then((data) => {
          if (data && data.length > 0) {
            const formatted = data.map((d) => ({
              time: d.recordedAt ? d.recordedAt.substring(11, 19) : '',
              cpuLoad: d.cpuLoad,
              ramUsage: d.ramUsage,
              gpuLoad: d.gpuLoad,
              cpuTemp: d.cpuTemp,
              gpuTemp: d.gpuTemp,
              ambientTemp: d.ambientTemp,
            }));
            setTelemetryHistory(formatted);
            setLatestTelemetry(data[data.length - 1]);
          }
        })
        .catch(() => {});
    }
  }, [selectedDeviceCode]);

  // STOMP WebSocket Live Telemetry Subscription
  const { connected } = useStompTopic<TelemetryDto>(
    `/topic/telemetry/${selectedDeviceCode}`,
    (newTel) => {
      setLatestTelemetry(newTel);
      setTelemetryHistory((prev) => {
        const timeStr = newTel.recordedAt
          ? newTel.recordedAt.substring(11, 19)
          : new Date().toLocaleTimeString();
        const next = [
          ...prev,
          {
            time: timeStr,
            cpuLoad: newTel.cpuLoad,
            ramUsage: newTel.ramUsage,
            gpuLoad: newTel.gpuLoad,
            cpuTemp: newTel.cpuTemp,
            gpuTemp: newTel.gpuTemp,
            ambientTemp: newTel.ambientTemp,
          },
        ];
        // Keep last 40 data points for smooth line chart
        return next.slice(-40);
      });
    }
  );

  // STOMP WebSocket Live Alerts Subscription
  useStompTopic<AlertDto>(`/topic/alerts/${selectedDeviceCode}`, (alert) => {
    setActiveAlert(alert);
    toast.error(`CẢNH BÁO IOT [${alert.type}]: ${alert.message}`);
  });

  const currentDevice = devices.find((d) => d.deviceCode === selectedDeviceCode);

  const handleScenarioChange = async (scenario: Scenario) => {
    try {
      await iotService.setScenario(selectedDeviceCode, scenario);
      toast.success(`Đã chuyển kịch bản giả lập sang: ${scenario}`);
      refetchDevices();
    } catch (e: any) {
      toast.error('Không thể điều khiển kịch bản giả lập');
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    try {
      const dev = await iotService.createDevice({
        deviceName: newDeviceName.trim(),
        roomLocation: newRoomLocation.trim() || undefined,
      });
      toast.success(`Tạo thiết bị thành công: ${dev.deviceCode}`);
      setIsAddModalOpen(false);
      setNewDeviceName('');
      setNewRoomLocation('');
      refetchDevices();
      setSelectedDeviceCode(dev.deviceCode);
    } catch (err: any) {
      toast.error('Lỗi khi đăng ký thiết bị mới');
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Device Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
              Bảng Điều Khiển IoT Giám Sát Phần Cứng Realtime
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dữ liệu truyền theo chu kỳ qua giao thức MQTT Mosquitto & phát trực tiếp lên trình duyệt qua WebSocket STOMP.
          </p>
        </div>

        {/* Device Switcher & Add Device Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Laptop className="w-4 h-4 text-sky-400" />
            <select
              value={selectedDeviceCode}
              onChange={(e) => setSelectedDeviceCode(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.deviceCode} value={d.deviceCode} className="bg-slate-900">
                  {d.deviceName} ({d.deviceCode})
                </option>
              ))}
              {devices.length === 0 && (
                <option value="PC-NHAN-001" className="bg-slate-900">
                  PC Gaming Trần Hữu Nhân (PC-NHAN-001)
                </option>
              )}
            </select>
          </div>

          <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Thêm Node
          </Button>
        </div>
      </div>

      {/* Connection & Status Pill Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold">
            {connected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <Wifi className="w-4 h-4" /> WebSocket Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <WifiOff className="w-4 h-4" /> Đang kết nối lại...
              </span>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Node:{' '}
            <strong className="text-slate-200">{currentDevice?.deviceName || selectedDeviceCode}</strong>
          </span>
          {currentDevice?.esp32Ip && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                ESP32 IP: <strong className="text-sky-400 font-mono">{currentDevice.esp32Ip}</strong>
              </span>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-mono hidden md:block">
          Cập nhật lần cuối: {latestTelemetry.recordedAt ? latestTelemetry.recordedAt.substring(11, 19) : 'Vừa xong'}
        </div>
      </div>

      {/* 2. Active Alarm Banner (BR09, BR10) */}
      <AlertBanner
        statusFlag={latestTelemetry.statusFlag}
        recentAlert={activeAlert}
        ambientTemp={latestTelemetry.ambientTemp}
      />

      {/* 3. Hardware Gauges Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* CPU Load Gauge */}
        <RadialGauge
          value={latestTelemetry.cpuLoad}
          title="CPU Load"
          unit="%"
          thresholds={{ warning: 70, danger: 85 }}
          subtitle={`${latestTelemetry.cpuClockMhz} MHz`}
        />

        {/* CPU Temp Gauge */}
        <RadialGauge
          value={latestTelemetry.cpuTemp}
          title="CPU Temp"
          unit="°C"
          thresholds={{ warning: 75, danger: 85 }}
          subtitle={latestTelemetry.cpuTemp > 85 ? '🔥 Nguy cơ quá nhiệt' : 'Làm mát ổn định'}
        />

        {/* RAM Usage Gauge */}
        <RadialGauge
          value={latestTelemetry.ramUsage}
          title="RAM Memory"
          unit="%"
          thresholds={{ warning: 75, danger: 88 }}
          subtitle={`${latestTelemetry.ramUsedGb} / ${latestTelemetry.ramTotalGb} GB`}
        />

        {/* GPU Load Gauge */}
        <RadialGauge
          value={latestTelemetry.gpuLoad}
          title="GPU Load"
          unit="%"
          thresholds={{ warning: 80, danger: 95 }}
          subtitle={`${latestTelemetry.gpuTemp}°C VRAM`}
        />

        {/* GPU Temp Gauge */}
        <RadialGauge
          value={latestTelemetry.gpuTemp}
          title="GPU Temp"
          unit="°C"
          thresholds={{ warning: 75, danger: 85 }}
          subtitle="Tản nhiệt quạt kép"
        />

        {/* Fan Speed Gauge with Spinning Icon */}
        <FanSpeedGauge rpm={latestTelemetry.fanSpeedRpm} />
      </div>

      {/* 4. ESP32 Environment Sensors Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Nhiệt Độ Phòng (ESP32 DHT22)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {latestTelemetry.ambientTemp}
              </span>
              <span className="text-xs text-slate-400 font-bold">°C</span>
              {latestTelemetry.ambientTemp >= 40 && (
                <span className="ml-2 text-[10px] font-bold text-rose-400">⚠️ Quá nóng (BR10)</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Độ Ẩm Không Khí Phòng
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {latestTelemetry.ambientHumidity}
              </span>
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Công Suất Tiêu Thụ Tức Thời
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {latestTelemetry.powerDrawW}
              </span>
              <span className="text-xs text-slate-400 font-bold">Watt</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Real-Time Streaming Line Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Chart (CPU / GPU / RAM %) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Biến Thiên Tải Phần Cứng Theo Thời Gian (%)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Stream 2s</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="cpuLoad"
                  name="CPU Load %"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ramUsage"
                  name="RAM %"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="gpuLoad"
                  name="GPU %"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart (CPU / GPU / Ambient °C) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Biến Thiên Nhiệt Độ Phần Cứng & Môi Trường (°C)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Ngưỡng: 85°C</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[20, 105]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="cpuTemp"
                  name="CPU Temp °C"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="gpuTemp"
                  name="GPU Temp °C"
                  stroke="#fb7185"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ambientTemp"
                  name="Phòng ESP32 °C"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Simulation Controls Toolbar */}
      <SimulationControls
        currentScenario={currentDevice?.currentScenario || 'IDLE'}
        onSelectScenario={handleScenarioChange}
      />

      {/* Modal Add Device */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Đăng Ký Node Thiết Bị IoT / PC Mới"
      >
        <form onSubmit={handleCreateDevice} className="space-y-4">
          <Input
            label="Tên thiết bị *"
            placeholder="Ví dụ: PC Làm Việc Phòng Khách"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            required
          />
          <Input
            label="Vị trí phòng máy (Tùy chọn)"
            placeholder="Ví dụ: Phòng 302 - Khoa CNTT HCMUNRE"
            value={newRoomLocation}
            onChange={(e) => setNewRoomLocation(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">
            Hệ thống sẽ tự sinh mã Device Code duy nhất (dạng PC-XXXXXX) để cấu hình vào mã nguồn ESP32 hoặc PC Agent.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Đăng Ký</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
