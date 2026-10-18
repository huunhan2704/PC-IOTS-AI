import api from './api';
import { CategoryDto, PageResponse, ProductDto, ReviewDto } from '@/types';

export interface ProductQueryParams {
  keyword?: string;
  category?: string;
  brands?: string;
  minPrice?: number;
  maxPrice?: number;
  socket?: string;
  ramGeneration?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export const productService = {
  getCategories: async (): Promise<CategoryDto[]> => {
    return api.get('/categories');
  },

  getProducts: async (params?: ProductQueryParams): Promise<PageResponse<ProductDto>> => {
    return api.get('/products', { params });
  },

  getSuggest: async (query: string): Promise<{ id: number; name: string; slug: string; imageUrl: string; price: number; categorySlug: string }[]> => {
    return api.get('/products/suggest', { params: { q: query } });
  },

  getBrands: async (): Promise<string[]> => {
    return api.get('/products/brands');
  },

  getProductBySlugOrId: async (idOrSlug: string | number): Promise<ProductDto> => {
    return api.get(`/products/${idOrSlug}`);
  },

  getReviews: async (productId: number): Promise<ReviewDto[]> => {
    return api.get(`/products/${productId}/reviews`);
  },

  createReview: async (productId: number, data: { rating: number; comment: string }): Promise<ReviewDto> => {
    return api.post(`/products/${productId}/reviews`, data);
  },
};
