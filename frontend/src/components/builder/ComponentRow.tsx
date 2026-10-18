import React from 'react';
import {
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  PlugZap,
  Fan,
  Box,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { PcSlot, ProductDto } from '@/types';
import { PriceTag } from '@/components/ui/PriceTag';

interface ComponentRowProps {
  slot: PcSlot;
  label: string;
  product: ProductDto | null;
  onOpenPicker: () => void;
  onRemove: () => void;
}

export const ComponentRow: React.FC<ComponentRowProps> = ({
  slot,
  label,
  product,
  onOpenPicker,
  onRemove,
}) => {
  const getSlotIcon = () => {
    switch (slot) {
      case 'CPU': return <Cpu className="w-5 h-5 text-sky-400" />;
      case 'MAINBOARD': return <CircuitBoard className="w-5 h-5 text-indigo-400" />;
      case 'RAM': return <MemoryStick className="w-5 h-5 text-purple-400" />;
      case 'VGA': return <Cpu className="w-5 h-5 text-rose-400" />;
      case 'SSD': return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'PSU': return <PlugZap className="w-5 h-5 text-emerald-400" />;
      case 'COOLER': return <Fan className="w-5 h-5 text-cyan-400" />;
      case 'CASE': return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition">
      {/* Slot label & icon */}
      <div className="flex items-center gap-3 w-44 shrink-0">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
          {getSlotIcon()}
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Linh kiện
          </span>
          <span className="text-xs font-bold text-slate-200">{label}</span>
        </div>
      </div>

      {/* Selected Product Info or Empty Placeholder */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        {product ? (
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-12 h-12 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate hover:text-sky-400">
                {product.name}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-slate-400">
                <span>{product.brand}</span>
                {product.specs?.tdp ? (
                  <span className="font-mono text-amber-400">TDP: {product.specs.tdp}W</span>
                ) : null}
                {product.specs?.socket ? (
                  <span className="font-mono text-sky-400">{product.specs.socket}</span>
                ) : null}
                {product.specs?.psuWattage ? (
                  <span className="font-mono text-emerald-400">
                    Công suất: {product.specs.psuWattage}W
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-right shrink-0">
              <PriceTag price={product.price} size="sm" />
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2">
            Chưa chọn linh kiện cho mục này
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {product ? (
          <>
            <button
              onClick={onOpenPicker}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 transition"
              title="Thay đổi linh kiện"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
              title="Xóa lựa chọn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onOpenPicker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Chọn {label}
          </button>
        )}
      </div>
    </div>
  );
};
