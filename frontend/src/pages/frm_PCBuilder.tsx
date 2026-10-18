import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  RotateCcw,
  Save,
  ShoppingCart,
  CheckCircle2,
  Bookmark,
  Share2,
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
