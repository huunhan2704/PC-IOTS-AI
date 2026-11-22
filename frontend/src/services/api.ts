import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const normalizedBase = rawBaseUrl
  ? (/^https?:\/\//i.test(rawBaseUrl.trim()) ? rawBaseUrl.trim() : `https://${rawBaseUrl.trim()}`).replace(/\/$/, '')
  : '';
const apiBaseUrl = normalizedBase ? `${normalizedBase}/api` : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If backend wrapped response in ApiResponse<T>, unwrap data
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (!response.data.success) {
        toast.error(response.data.message || 'Có lỗi xảy ra');
        return Promise.reject(new Error(response.data.message));
      }
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const reqUrl = error.config?.url || '';
    if (error.response?.status === 401) {
      if (reqUrl.includes('/auth/login')) {
        const msg = error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác';
        toast.error(msg);
      } else {
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/dang-nhap')) {
          toast.error(error.response?.data?.message || 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        }
      }
    } else {
      const msg = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
