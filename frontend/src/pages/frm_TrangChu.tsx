import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  PlugZap,
  Fan,
  Box,
  Wrench,
  Activity,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { productService, ProductQueryParams } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { FacetFilter } from '@/components/product/FacetFilter';
import { Pagination } from '@/components/ui/Pagination';

export const frm_TrangChu: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || undefined;
  const currentKeyword = searchParams.get('keyword') || undefined;
  const currentBrands = searchParams.get('brands') || undefined;
  const currentSocket = searchParams.get('socket') || undefined;
  const currentRamGen = searchParams.get('ramGen') || undefined;
  const currentMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const currentInStock = searchParams.get('inStock') === 'true' ? true : undefined;
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 0;

  const filters: ProductQueryParams = {
    category: currentCategory,
    keyword: currentKeyword,
    brands: currentBrands,
    socket: currentSocket,
    ramGeneration: currentRamGen,
    maxPrice: currentMaxPrice,
    inStock: currentInStock,
    sort: currentSort,
    page: currentPage,
    size: 12,
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: productService.getBrands,
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });

  const handleFilterChange = (newFilters: ProductQueryParams) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.keyword) params.set('keyword', newFilters.keyword);
    if (newFilters.brands) params.set('brands', newFilters.brands);
    if (newFilters.socket) params.set('socket', newFilters.socket);
    if (newFilters.ramGeneration) params.set('ramGen', newFilters.ramGeneration);
    if (newFilters.maxPrice) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.page && newFilters.page > 0) params.set('page', String(newFilters.page));
    setSearchParams(params);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'mainboard': return <CircuitBoard className="w-5 h-5" />;
      case 'ram': return <MemoryStick className="w-5 h-5" />;
      case 'vga': return <Cpu className="w-5 h-5 text-rose-400" />;
      case 'ssd': return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'psu': return <PlugZap className="w-5 h-5 text-emerald-400" />;
      case 'cooler': return <Fan className="w-5 h-5 text-cyan-400" />;
      case 'case': return <Box className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Hero Banner */}
      {!currentCategory && !currentKeyword && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 p-8 sm:p-12">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Nền Tảng Phần Cứng Thông Minh IoT & AI
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
              Hệ Thống Linh Kiện PC Tích Hợp{' '}
              <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                IoTs & AI
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Giải pháp thương mại điện tử công nghệ cao kết hợp công cụ PC Builder tự động kiểm tra tương thích, giám sát cảm biến phần cứng qua MQTT và trợ lý AI chuẩn đoán điểm nghẽn tối ưu hóa 1-click.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/pc-builder"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/25 transition active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                Xây Dựng Cấu Hình (PC Builder)
              </Link>
              <Link
                to="/iot"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition active:scale-95"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                Dashboard IoT Realtime
              </Link>
              <Link
                to="/tu-van-ai"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Chuẩn Đoán AI
              </Link>
            </div>
          </div>

          {/* Feature strip */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <span>Kiểm tra tương thích phần cứng 100% (BR01-BR06)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Giám sát nhiệt độ phòng & phần cứng qua ESP32/MQTT</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Giao hàng toàn quốc & thanh toán VietQR tự động</span>
            </div>
          </div>
        </section>
      )}

      {/* 2. Mega Menu Danh Mục 8 Loại Linh Kiện */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            Danh Mục Linh Kiện Máy Tính
          </h2>
          {currentCategory && (
            <button
              onClick={() => handleFilterChange({ ...filters, category: undefined, page: 0 })}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả danh mục
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleFilterChange({ ...filters, category: cat.slug, page: 0 })}
                className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition group ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 border border-slate-800 group-hover:text-sky-400'
                  }`}
                >
                  {getCategoryIcon(cat.slug)}
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-1">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Product Catalog Grid & Facet Filter */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Facet Filter Sidebar */}
        <div className="lg:col-span-1">
          <FacetFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            availableBrands={brands}
          />
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-400">
              Hiển thị{' '}
              <strong className="text-slate-200">{productsData?.totalElements || 0}</strong> sản phẩm
              {currentCategory && (
                <span>
                  {' '}
                  thuộc danh mục <strong className="text-sky-400">{currentCategory}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-slate-400">Sắp xếp:</span>
              <select
                value={filters.sort || 'newest'}
                onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value, page: 0 })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4 animate-pulse h-80"
                />
              ))}
            </div>
          ) : productsData && productsData.content.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {productsData.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={productsData.page}
                totalPages={productsData.totalPages}
                onPageChange={(p) => handleFilterChange({ ...filters, page: p })}
              />
            </>
          ) : (
            <div className="py-20 text-center bg-slate-900/30 border border-slate-800/60 rounded-3xl space-y-3">
              <p className="text-base font-bold text-slate-300">Không tìm thấy linh kiện phù hợp</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy thử nới lỏng bộ lọc giá, chọn lại socket hoặc xóa từ khóa tìm kiếm.
              </p>
              <button
                onClick={() => handleFilterChange({ page: 0, size: 12 })}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
