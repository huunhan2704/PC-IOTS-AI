import api from './api';
import { BuildSelection, CompatibilityReport, PcBuildDto, PcSlot, ProductDto } from '@/types';

export const builderService = {
  validateBuild: async (selection: BuildSelection): Promise<CompatibilityReport> => {
    return api.post('/pc-builder/validate', selection);
  },

  getCompatibleProducts: async (slot: PcSlot, selection: BuildSelection): Promise<ProductDto[]> => {
    return api.get('/pc-builder/compatible-products', {
      params: {
        slot,
        ...selection,
      },
    });
  },

  quickCheck: async (productAId: number, productBId: number): Promise<{ compatible: boolean; messages: string[] }> => {
    return api.post('/pc-builder/quick-check', { productAId, productBId });
  },

  aiSuggest: async (budget: number, purpose: string = 'GAMING'): Promise<any> => {
    return api.post('/pc-builder/ai-suggest', { budget, purpose });
  },

  saveBuild: async (data: BuildSelection & { buildName: string }): Promise<PcBuildDto> => {
    return api.post('/pc-builder/builds', data);
  },

  getMyBuilds: async (): Promise<PcBuildDto[]> => {
    return api.get('/pc-builder/builds/my');
  },

  deleteBuild: async (id: number): Promise<void> => {
    return api.delete(`/pc-builder/builds/${id}`);
  },
};
