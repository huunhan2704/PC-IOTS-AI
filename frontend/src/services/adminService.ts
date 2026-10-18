import api from './api';
import { AdminDashboardDto, AlertDto, DeviceDto, OrderDto, PageResponse, ProductDto } from '@/types';

export const adminService = {
  getDashboard: async (): Promise<AdminDashboardDto> => {
    return api.get('/admin/dashboard');
  },

  getProducts: async (params?: { keyword?: string; category?: string; page?: number; size?: number }): Promise<PageResponse<ProductDto>> => {
    return api.get('/admin/products', { params });
  },

  createProduct: async (data: any): Promise<ProductDto> => {
    return api.post('/admin/products', data);
  },

  updateProduct: async (id: number, data: any): Promise<ProductDto> => {
    return api.put(`/admin/products/${id}`, data);
  },

  updateStock: async (id: number, data: { quantity: number; note?: string }): Promise<ProductDto> => {
    return api.patch(`/admin/products/${id}/stock`, data);
  },

  deleteProduct: async (id: number): Promise<void> => {
    return api.delete(`/admin/products/${id}`);
  },

  getOrders: async (params?: { status?: string; keyword?: string; page?: number; size?: number }): Promise<PageResponse<OrderDto>> => {
    return api.get('/admin/orders', { params });
  },

  updateOrderStatus: async (id: number, status: string): Promise<OrderDto> => {
    return api.patch(`/admin/orders/${id}/status`, { status });
  },

  updateOrderPayment: async (id: number, paymentStatus: string): Promise<OrderDto> => {
    return api.patch(`/admin/orders/${id}/payment`, { paymentStatus });
  },

  cancelOrder: async (id: number, reason?: string): Promise<OrderDto> => {
    return api.post(`/admin/orders/${id}/cancel`, { reason });
  },

  getDevices: async (): Promise<DeviceDto[]> => {
    return api.get('/admin/devices');
  },

  getAlerts: async (): Promise<AlertDto[]> => {
    return api.get('/admin/alerts');
  },
};
