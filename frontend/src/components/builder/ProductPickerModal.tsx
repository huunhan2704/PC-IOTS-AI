import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PriceTag } from '@/components/ui/PriceTag';
import { PcSlot, ProductDto } from '@/types';
import { builderService } from '@/services/builderService';
import { useBuilderStore } from '@/store/builderStore';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: PcSlot;
  slotLabel: string;
  onSelect: (product: ProductDto) => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  slot,
  slotLabel,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const { cpu, mainboard, ram, gpu, storage, psu, cooler, caseProduct } = useBuilderStore();

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

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['compatible-products', slot, selection],
    queryFn: () => builderService.getCompatibleProducts(slot, selection),
    enabled: isOpen,
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chọn ${slotLabel} tương thích`} maxWidth="2xl">
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm kiếm ${slotLabel}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Product List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Đang tải danh sách linh kiện tương thích...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Không tìm thấy linh kiện phù hợp với các lựa chọn hiện tại
            </div>
          ) : (
            filtered.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-950 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate group-hover:text-sky-400">
                      {prod.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{prod.brand}</span>
                      {prod.specs?.socket && <span>• Socket: {prod.specs.socket}</span>}
                      {prod.specs?.ramGeneration && <span>• {prod.specs.ramGeneration}</span>}
                      {prod.specs?.tdp ? <span>• TDP {prod.specs.tdp}W</span> : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <PriceTag price={prod.price} size="sm" />
                  <button
                    onClick={() => {
                      onSelect(prod);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Chọn
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
