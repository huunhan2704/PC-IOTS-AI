import api from './api';
import { CartValidationResult, CouponResult } from '@/types';

export const cartService = {
  validateCart: async (items: { productId: number; quantity: number }[]): Promise<CartValidationResult[]> => {
    return api.post('/cart/validate', { items });
  },

  applyCoupon: async (code: string, subtotal: number): Promise<CouponResult> => {
    return api.post('/coupons/apply', { code, subtotal });
  },
};
