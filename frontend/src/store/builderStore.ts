import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductDto, PcSlot, CompatibilityReport } from '@/types';

interface BuilderState {
  cpu: ProductDto | null;
  mainboard: ProductDto | null;
  ram: ProductDto | null;
  gpu: ProductDto | null;
  storage: ProductDto | null;
  psu: ProductDto | null;
  cooler: ProductDto | null;
  caseProduct: ProductDto | null;
  report: CompatibilityReport | null;
  selectSlot: (slot: PcSlot, product: ProductDto | null) => void;
  clearSlot: (slot: PcSlot) => void;
  clearAll: () => void;
  setReport: (report: CompatibilityReport | null) => void;
  getTotalPrice: () => number;
  getTotalTdp: () => number;
  getRecommendedPsu: () => number;
  getSelectedProducts: () => ProductDto[];
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      cpu: null,
      mainboard: null,
      ram: null,
      gpu: null,
      storage: null,
      psu: null,
      cooler: null,
      caseProduct: null,
      report: null,
      selectSlot: (slot, product) => {
        switch (slot) {
          case 'CPU': set({ cpu: product }); break;
          case 'MAINBOARD': set({ mainboard: product }); break;
          case 'RAM': set({ ram: product }); break;
          case 'VGA': set({ gpu: product }); break;
          case 'SSD': set({ storage: product }); break;
          case 'PSU': set({ psu: product }); break;
          case 'COOLER': set({ cooler: product }); break;
          case 'CASE': set({ caseProduct: product }); break;
        }
      },
      clearSlot: (slot) => {
        get().selectSlot(slot, null);
      },
      clearAll: () => {
        set({
          cpu: null,
          mainboard: null,
          ram: null,
          gpu: null,
          storage: null,
          psu: null,
          cooler: null,
          caseProduct: null,
          report: null,
        });
      },
      setReport: (report) => set({ report }),
      getTotalPrice: () => {
        const prods = get().getSelectedProducts();
        return prods.reduce((sum, p) => sum + p.price, 0);
      },
      getTotalTdp: () => {
        const { cpu, gpu, ram, storage, mainboard, cooler } = get();
        let total = 50; // Base system load (fans, motherboard, chipset)
        if (cpu?.specs?.tdp) total += cpu.specs.tdp;
        if (gpu?.specs?.tdp) total += gpu.specs.tdp;
        if (ram?.specs?.tdp) total += ram.specs.tdp;
        if (storage?.specs?.tdp) total += storage.specs.tdp;
        if (mainboard?.specs?.tdp) total += mainboard.specs.tdp;
        if (cooler?.specs?.tdp) total += cooler.specs.tdp;
        return total;
      },
      getRecommendedPsu: () => {
        const tdp = get().getTotalTdp();
        return Math.ceil((tdp * 1.25) / 50) * 50; // Làm tròn theo bước 50W
      },
      getSelectedProducts: () => {
        const { cpu, mainboard, ram, gpu, storage, psu, cooler, caseProduct } = get();
        return [cpu, mainboard, ram, gpu, storage, psu, cooler, caseProduct].filter(Boolean) as ProductDto[];
      },
    }),
    {
      name: 'linhkien-pc-builder',
    }
  )
);
