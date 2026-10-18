import api from './api';
import { CreateOrderRequest, OrderDto } from '@/types';

export const orderService = {
  createOrder: async (data: CreateOrderRequest): Promise<OrderDto> => {
    return api.post('/orders', data);
  },

  getMyOrders: async (): Promise<OrderDto[]> => {
    return api.get('/orders/my');
  },

  trackOrder: async (orderCode: string): Promise<OrderDto> => {
    return api.get(`/orders/track/${orderCode}`);
  },

  cancelOrder: async (orderId: number, reason?: string): Promise<OrderDto> => {
    return api.post(`/orders/${orderId}/cancel`, { reason });
  },
};
