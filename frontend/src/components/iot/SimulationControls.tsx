import React from 'react';
import { Coffee, Gamepad2, Flame, Square } from 'lucide-react';
import { Scenario } from '@/types';

interface SimulationControlsProps {
  currentScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentScenario,
  onSelectScenario,
  isLoading = false,
  disabled = false,
}) => {
  const scenarios: { id: Scenario; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'IDLE',
      label: 'Nghỉ (Idle)',
      desc: 'CPU ~5%, 42°C, Phòng 28°C',
      icon: <Coffee className="w-4 h-4" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 active:border-emerald-500',
    },
    {
      id: 'GAMING',
      label: 'Chơi Game (Gaming)',
      desc: 'CPU ~65%, 72°C, GPU ~95%',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'hover:border-sky-500/50 hover:bg-sky-500/10 active:border-sky-500',
    },
    {
      id: 'STRESS',
      label: 'Ép Xung Quá Nhiệt (Stress Test)',
      desc: 'CPU 100%, 92°C, Phòng 41°C',
      icon: <Flame className="w-4 h-4" />,
      color: 'hover:border-rose-500/50 hover:bg-rose-500/10 active:border-rose-500',
    },
    {
      id: 'STOP',
      label: 'Dừng Mô Phỏng',
      desc: 'Tạm ngưng luồng dữ liệu giả lập',
      icon: <Square className="w-4 h-4" />,
      color: 'hover:border-slate-600 hover:bg-slate-800',
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Thanh Điều Khiển Giả Lập IoT & PC Agent
          </h4>
          <p className="text-[11px] text-slate-400">
            Chuyển nhanh trạng thái tải phần cứng và môi trường để kiểm thử cảnh báo thời gian thực
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scenarios.map((sc) => {
          const isActive = currentScenario === sc.id;
          return (
            <button
              key={sc.id}
              disabled={isLoading || disabled}
              onClick={() => onSelectScenario(sc.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-40 disabled:pointer-events-none ${sc.color} ${
                isActive
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400 shadow-md shadow-sky-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  isActive ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {sc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{sc.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
