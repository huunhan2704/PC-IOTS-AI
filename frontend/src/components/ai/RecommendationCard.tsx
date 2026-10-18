import React from 'react';
import { ArrowRight, CheckCircle2, ShoppingCart, Sparkles } from 'lucide-react';
import { AiRecommendationDto } from '@/types';
import { PriceTag } from '@/components/ui/PriceTag';
import { useCartStore } from '@/store/cartStore';

interface RecommendationCardProps {
  recommendation: AiRecommendationDto;
  onApply?: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApply,
}) => {
  const addItem = useCartStore((s) => s.addItem);
  const rec = recommendation.recommendedProduct;
  const cur = recommendation.currentComponent;

  const handleAddToCart = () => {
    addItem(rec, 1);
    if (onApply) onApply();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 space-y-4 transition shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Gợi Ý Nâng Cấp Tương Thích 100%
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Tương thích phần cứng
        </span>
      </div>

      {/* Comparison: Current -> Arrow -> Recommended */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
        {/* Current Component */}
        <div className="md:col-span-5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
          {cur ? (
            <>
              <img
                src={cur.imageUrl}
                alt={cur.name}
                className="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Linh Kiện Hiện Tại
                </span>
                <p className="text-xs font-semibold text-slate-300 truncate">{cur.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{cur.brand}</p>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 italic p-2">
              Linh kiện hiện tại chưa thiết lập
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex justify-center text-sky-400">
          <ArrowRight className="w-5 h-5 hidden md:block" />
          <span className="md:hidden text-xs font-bold uppercase text-sky-400">
            ↓ Nâng cấp lên
          </span>
        </div>

        {/* Recommended Component */}
        <div className="md:col-span-5 bg-sky-950/20 p-3 rounded-xl border border-sky-500/30 flex items-center gap-3">
          <img
            src={rec.imageUrl}
            alt={rec.name}
            className="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">
              Linh Kiện Đề Xuất
            </span>
            <p className="text-xs font-bold text-slate-100 truncate hover:text-sky-300">
              {rec.name}
            </p>
            <PriceTag price={rec.price} originalPrice={rec.originalPrice} size="sm" />
          </div>
        </div>
      </div>

      {/* Expected Performance Gain highlight */}
      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-4">
        <div className="text-xs">
          <span className="font-bold text-emerald-400">Hiệu năng dự kiến: </span>
          <span className="text-slate-200">{recommendation.expectedPerformanceGain}</span>
        </div>

        <button
          onClick={handleAddToCart}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 transition shrink-0 active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
};
