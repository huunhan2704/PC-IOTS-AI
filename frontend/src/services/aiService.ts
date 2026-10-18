import api from './api';
import { AiRecommendationDto, DiagnosticReport } from '@/types';

export const aiService = {
  getDiagnostics: async (deviceCode: string): Promise<DiagnosticReport> => {
    return api.get(`/ai/diagnostics/${deviceCode}`);
  },

  runDiagnostics: async (deviceCode: string): Promise<DiagnosticReport> => {
    return api.post(`/ai/diagnostics/${deviceCode}/run`);
  },

  markViewed: async (recommendationId: number): Promise<AiRecommendationDto> => {
    return api.post(`/ai/recommendations/${recommendationId}/viewed`);
  },

  markApplied: async (recommendationId: number): Promise<AiRecommendationDto> => {
    return api.post(`/ai/recommendations/${recommendationId}/apply`);
  },
};
