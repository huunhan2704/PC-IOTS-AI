import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { ProductQueryParams } from '@/services/productService';

interface FacetFilterProps {
  filters: ProductQueryParams;
  onFilterChange: (newFilters: ProductQueryParams) => void;
  availableBrands: string[];
}

export const FacetFilter: React.FC<FacetFilterProps> = ({
  filters,
  onFilterChange,
  availableBrands,
}) => {
  const selectedBrands = filters.brands ? filters.brands.split(',') : [];

  const handleBrandToggle = (brand: string) => {
    let updated: string[];
    if (selectedBrands.includes(brand)) {
      updated = selectedBrands.filter((b) => b !== brand);
    } else {
      updated = [...selectedBrands, brand];
    }
    onFilterChange({
      ...filters,
      brands: updated.length > 0 ? updated.join(',') : undefined,
      page: 0,
    });
  };

  const handleSocketChange = (socket?: string) => {
    onFilterChange({
      ...filters,
      socket: socket === filters.socket ? undefined : socket,
      page: 0,
    });
  };

  const handleRamGenChange = (ramGen?: string) => {
    onFilterChange({
      ...filters,
      ramGeneration: ramGen === filters.ramGeneration ? undefined : ramGen,
      page: 0,
    });
  };

  const handlePriceChange = (maxPrice: number) => {
    onFilterChange({
      ...filters,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      page: 0,
    });
  };

  const handleReset = () => {
    onFilterChange({
      category: filters.category,
      keyword: filters.keyword,
      page: 0,
      size: 12,
    });
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  return (
    <aside className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Bộ Lọc Nâng Cao
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Đặt lại
        </button>
      </div>

      {/* Khoảng giá slider */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-200">
          Mức Giá Tối Đa: {filters.maxPrice ? formatVnd(filters.maxPrice) : 'Tất cả'}
        </label>
        <input
          type="range"
          min="500000"
          max="35000000"
          step="500000"
          value={filters.maxPrice || 35000000}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>500k</span>
          <span>15 triệu</span>
          <span>35+ triệu</span>
        </div>
      </div>

      {/* Thương hiệu */}
      {availableBrands.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200">Thương Hiệu</h4>
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {availableBrands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Socket CPU / Mainboard */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-200">Chuẩn Socket</h4>
        <div className="flex flex-wrap gap-1.5">
          {['LGA1700', 'AM5', 'AM4'].map((s) => (
            <button
              key={s}
              onClick={() => handleSocketChange(s)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                filters.socket === s
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chuẩn RAM */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-200">Chuẩn RAM</h4>
        <div className="flex gap-2">
          {['DDR4', 'DDR5'].map((r) => (
            <button
              key={r}
              onClick={() => handleRamGenChange(r)}
              className={`flex-1 text-xs py-1.5 rounded-lg border font-semibold transition ${
                filters.ramGeneration === r
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Còn hàng toggle */}
      <div className="pt-2 border-t border-slate-800">
        <label className="flex items-center justify-between text-xs font-medium text-slate-300 cursor-pointer select-none">
          <span>Chỉ hiện sản phẩm còn hàng</span>
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) =>
              onFilterChange({ ...filters, inStock: e.target.checked || undefined, page: 0 })
            }
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
          />
        </label>
      </div>
    </aside>
  );
};
