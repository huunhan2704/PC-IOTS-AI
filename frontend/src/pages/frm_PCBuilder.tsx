import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  RotateCcw,
  Save,
  ShoppingCart,
  CheckCircle2,
  Bookmark,
  Share2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useBuilderStore } from '@/store/builderStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { builderService } from '@/services/builderService';
import { PcSlot, ProductDto } from '@/types';
import { ComponentRow } from '@/components/builder/ComponentRow';
import { CompatibilityBox } from '@/components/builder/CompatibilityBox';
import { ProductPickerModal } from '@/components/builder/ProductPickerModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const frm_PCBuilder: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    cpu,
    mainboard,
    ram,
    gpu,
    storage,
    psu,
    cooler,
    caseProduct,
    report,
    selectSlot,
    clearSlot,
    clearAll,
    setReport,
    getTotalPrice,
    getTotalTdp,
    getRecommendedPsu,
    getSelectedProducts,
  } = useBuilderStore();

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [activePickerSlot, setActivePickerSlot] = useState<PcSlot | null>(null);
  const [activePickerLabel, setActivePickerLabel] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [buildName, setBuildName] = useState('Cấu hình Gaming 2026');

  // AI Build by Budget State
  const [aiBudget, setAiBudget] = useState<string>('15000000');
  const [aiPurpose, setAiPurpose] = useState<'GAMING' | 'OFFICE' | 'WORKSTATION'>('GAMING');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const slots: { slot: PcSlot; label: string; product: ProductDto | null }[] = [
    { slot: 'CPU', label: 'Vi xử lý (CPU)', product: cpu },
    { slot: 'MAINBOARD', label: 'Bo mạch chủ (Mainboard)', product: mainboard },
    { slot: 'RAM', label: 'Bộ nhớ trong (RAM)', product: ram },
    { slot: 'VGA', label: 'Card đồ họa (VGA)', product: gpu },
    { slot: 'SSD', label: 'Ổ cứng lưu trữ (SSD)', product: storage },
    { slot: 'PSU', label: 'Nguồn máy tính (PSU)', product: psu },
    { slot: 'COOLER', label: 'Tản nhiệt (Cooler)', product: cooler },
    { slot: 'CASE', label: 'Vỏ máy tính (Case)', product: caseProduct },
  ];

  // Validate build whenever selections change
  useEffect(() => {
    const selection = {
      cpuId: cpu?.id,
      mainboardId: mainboard?.id,
      ramId: ram?.id,
      gpuId: gpu?.id,
      storageId: storage?.id,
      psuId: psu?.id,
      coolerId: cooler?.id,
      caseId: caseProduct?.id,
    };

    builderService
      .validateBuild(selection)
      .then((rep) => setReport(rep))
      .catch(() => {});
  }, [cpu, mainboard, ram, gpu, storage, psu, cooler, caseProduct, setReport]);

  const handleOpenPicker = (slot: PcSlot, label: string) => {
    setActivePickerSlot(slot);
    setActivePickerLabel(label);
  };

  const handleAddAllToCart = () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập tài khoản trước khi mua hàng!');
      navigate('/dang-nhap');
      return;
    }
    const products = getSelectedProducts();
    if (products.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 linh kiện trước khi thêm vào giỏ');
      return;
    }
    if (report && !report.compatible) {
      if (!confirm('Cấu hình hiện tại có cảnh báo xung đột linh kiện. Bạn có chắc chắn muốn thêm vào giỏ không?')) {
        return;
      }
    }
    products.forEach((p) => addItem(p, 1));
    toast.success(`Đã thêm ${products.length} linh kiện cấu hình vào giỏ hàng!`);
  };

  const handleSaveBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu cấu hình PC');
      return;
    }
    if (!buildName.trim()) return;

    try {
      await builderService.saveBuild({
        buildName: buildName.trim(),
        cpuId: cpu?.id,
        mainboardId: mainboard?.id,
        ramId: ram?.id,
        gpuId: gpu?.id,
        storageId: storage?.id,
        psuId: psu?.id,
        coolerId: cooler?.id,
        caseId: caseProduct?.id,
      });
      toast.success('Đã lưu cấu hình PC thành công!');
      setIsSaveModalOpen(false);
    } catch (err: any) {
      toast.error('Không thể lưu cấu hình lúc này');
    }
  };

  const handleAiBuild = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numericBudget = Number(aiBudget.replace(/[^0-9]/g, ''));
    if (!numericBudget || numericBudget <= 0) {
      toast.warning('Vui lòng nhập số tiền ngân sách hợp lệ (VD: 15000000)');
      return;
    }

    setAiLoading(true);
    try {
      const res = await builderService.aiSuggest(numericBudget, aiPurpose);
      clearAll();
      if (res.cpu) selectSlot('CPU', res.cpu);
      if (res.mainboard) selectSlot('MAINBOARD', res.mainboard);
      if (res.ram) selectSlot('RAM', res.ram);
      if (res.gpu) selectSlot('VGA', res.gpu);
      if (res.storage) selectSlot('SSD', res.storage);
      if (res.psu) selectSlot('PSU', res.psu);
      if (res.cooler) selectSlot('COOLER', res.cooler);
      if (res.caseProduct) selectSlot('CASE', res.caseProduct);

      setAiSummary(res.aiSummary);
      if (res.withinBudget) {
        toast.success('AI đã bóc xong cấu hình PC tương thích 100% theo ngân sách!');
      } else {
        toast.info('Ngân sách quá thấp, AI đã chọn cấu hình tiết kiệm nhất hiện có trong kho.');
      }
    } catch (err: any) {
      toast.error('Lỗi khi AI bóc cấu hình: ' + (err?.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const totalPrice = getTotalPrice();
  const totalTdp = getTotalTdp();
  const recommendedPsu = getRecommendedPsu();
  const selectedPsuWattage = psu?.specs?.psuWattage;

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
              Công Cụ Xây Dựng Cấu Hình PC (PC Builder)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Động cơ kiểm tra tương thích thời gian thực: Tự động khóa linh kiện không khớp Socket, chuẩn DDR, kích thước Case & công suất nguồn an toàn BR01 - BR06.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Làm Mới
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsSaveModalOpen(true)}>
            <Save className="w-3.5 h-3.5 mr-1" />
            Lưu Cấu Hình
          </Button>
        </div>
      </div>

      {/* 1.5 AI Build PC theo ngân sách */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-sky-950/40 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg shadow-indigo-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-100 uppercase tracking-wide">
                Build PC Thông Minh Bằng AI Theo Ngân Sách
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Nhập số tiền tối đa muốn chi — AI sẽ tự động truy vấn kho hàng và bóc ra cấu hình mạnh nhất, tương thích 100% (Socket, RAM, PSU, Case).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '10 Triệu', val: '10000000' },
              { label: '15 Triệu', val: '15000000' },
              { label: '20 Triệu', val: '20000000' },
              { label: '30 Triệu', val: '30000000' },
              { label: '50 Triệu', val: '50000000' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setAiBudget(preset.val)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  aiBudget === preset.val
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAiBuild} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">
              Ngân sách tối đa (VNĐ)
            </label>
            <input
              type="number"
              min="1000000"
              step="any"
              value={aiBudget}
              onChange={(e) => setAiBudget(e.target.value)}
              placeholder="VD: 15000000"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm font-mono font-bold text-sky-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">
              Nhu cầu sử dụng
            </label>
            <select
              value={aiPurpose}
              onChange={(e) => setAiPurpose(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm font-semibold text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="GAMING">Chơi Game / Đồ Họa (Ưu tiên VGA + CPU)</option>
              <option value="WORKSTATION">Render / Lập Trình (Ưu tiên CPU + RAM)</option>
              <option value="OFFICE">Văn Phòng / Học Tập (Cân đối tiết kiệm)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <Button
              type="submit"
              disabled={aiLoading}
              className="w-full h-[42px] bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Đang Chọn...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Bóc Cấu Hình
                </>
              )}
            </Button>
          </div>
        </form>

        {aiSummary && (
          <div className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{aiSummary}</span>
          </div>
        )}
      </div>

      {/* 2. Main Builder Layout: 8 Component Rows + Sticky Summary Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: 8 Component Slot Rows */}
        <div className="lg:col-span-2 space-y-3">
          {slots.map(({ slot, label, product }) => (
            <ComponentRow
              key={slot}
              slot={slot}
              label={label}
              product={product}
              onOpenPicker={() => handleOpenPicker(slot, label)}
              onRemove={() => clearSlot(slot)}
            />
          ))}
        </div>

        {/* Right: Compatibility Summary Box & Actions */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <CompatibilityBox
            report={report}
            totalPrice={totalPrice}
            totalTdp={totalTdp}
            recommendedPsu={recommendedPsu}
            selectedPsuWattage={selectedPsuWattage}
          />

          <Button
            variant="primary"
            size="lg"
            onClick={handleAddAllToCart}
            className="w-full shadow-lg shadow-sky-500/20"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cho Toàn Bộ Bộ Máy Vào Giỏ Hàng
          </Button>
        </div>
      </div>

      {/* Product Picker Modal */}
      {activePickerSlot && (
        <ProductPickerModal
          isOpen={!!activePickerSlot}
          onClose={() => setActivePickerSlot(null)}
          slot={activePickerSlot}
          slotLabel={activePickerLabel}
          onSelect={(p) => selectSlot(activePickerSlot, p)}
        />
      )}

      {/* Save Build Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Lưu Cấu Hình PC Cá Nhân"
      >
        <form onSubmit={handleSaveBuild} className="space-y-4">
          <Input
            label="Tên cấu hình máy tính *"
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            placeholder="Ví dụ: PC Gaming RTX 4070 Livestream"
            required
          />
          <p className="text-xs text-slate-400">
            Cấu hình này sẽ được lưu vào tài khoản của bạn để dễ dàng tra cứu, chia sẻ hoặc nâng cấp trong tương lai.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsSaveModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu Cấu Hình</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
