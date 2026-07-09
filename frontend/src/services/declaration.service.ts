// frontend/src/services/declaration.service.ts
import apiClient from './api.client';
import type { DeclarationConfig, DeclarationMode } from '../types/declaration.types';

export const declarationService = {
  getCurrent: async (): Promise<DeclarationConfig> => {
    const response = await apiClient.get<DeclarationConfig>('/declarations');
    return response.data;
  },

  save: async (mode: DeclarationMode, specificDate?: string | null): Promise<DeclarationConfig> => {
    const response = await apiClient.put<{ success: boolean; data: DeclarationConfig }>('/declarations', {
      mode,
      specificDate: specificDate || null
    });
    return response.data.data;
  }
};
