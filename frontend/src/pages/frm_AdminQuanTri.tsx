import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Activity,
  BarChart3,
  Plus,
  Search,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  Laptop,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '@/services/adminService';
import { OrderDto, OrderStatus, ProductDto } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PriceTag } from '@/components/ui/PriceTag';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, UserPlus, Lock, Unlock, FileSpreadsheet, Printer, Calendar, Cpu, Copy, Eye, User, Phone, MapPin, CreditCard, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export const frm_AdminQuanTri: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin, isWarehouse, isTechnician } = useAuthStore();
  const adminRole = isAdmin();
  const warehouseRole = isWarehouse();
  const techRole = isTechnician();

  const defaultTab = adminRole ? 'dashboard' : warehouseRole ? 'products' : 'devices';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'devices' | 'users' | 'revenue'>(defaultTab);

  // IoT Devices Modal State
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [configDevice, setConfigDevice] = useState<any | null>(null);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [deviceForm, setDeviceForm] = useState({
    deviceCode: '',
    deviceName: '',
    userId: 2,
    macAddress: '',
    esp32Ip: '192.168.1.105',
    roomLocation: 'Phòng kỹ thuật',
  });

  // Revenue Report & Order Detail State
  const [revStartDate, setRevStartDate] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0]);
  const [revEndDate, setRevEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderDto | null>(null);

  // Users & Roles Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'ROLE_WAREHOUSE',
  });

  // Products Tab State
  const [prodSearch, setProdSearch] = useState('');
  const [prodPage, setProdPage] = useState(0);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    categoryId: 1,
    price: 1000000,
    originalPrice: 1200000,
    stockQuantity: 15,
    warrantyMonths: 24,
    imageUrl: '',
    description: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [stockAddQty, setStockAddQty] = useState(10);
  const [stockNote, setStockNote] = useState('Nhập hàng định kỳ từ nhà phân phối');

  // Orders Tab State
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('ALL');

  // Queries
  const { data: dashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminService.getDashboard,
    enabled: activeTab === 'dashboard' || activeTab === 'revenue',
  });

  const { data: productsPage, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products', prodSearch, prodPage],
    queryFn: () => adminService.getProducts({ keyword: prodSearch, page: prodPage, size: 12 }),
    enabled: activeTab === 'products',
  });

  const saveProductMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingProduct) {
        return adminService.updateProduct(editingProduct.id, data);
      }
      return adminService.createProduct(data);
    },
    onSuccess: () => {
      refetchProducts();
      setIsProductModalOpen(false);
      toast.success(editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!');
    },
    onError: (err: any) => {
      toast.error('Lỗi khi lưu sản phẩm: ' + (err?.response?.data?.message || err.message));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteProduct(id),
    onSuccess: () => {
      refetchProducts();
      toast.success('Đã xóa (vô hiệu hóa) linh kiện thành công!');
    },
    onError: (err: any) => {
      toast.error('Không thể xóa sản phẩm: ' + (err?.response?.data?.message || err.message));
    },
  });

  const { data: ordersPage, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders', selectedOrderStatus],
    queryFn: () =>
      adminService.getOrders({
        status: selectedOrderStatus === 'ALL' ? undefined : selectedOrderStatus,
        size: 20,
      }),
    enabled: activeTab === 'orders',
  });

  const { data: devices = [], refetch: refetchDevices } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: adminService.getDevices,
    enabled: activeTab === 'devices',
    refetchInterval: 10000,
  });

  const { data: userSummaries = [] } = useQuery({
    queryKey: ['admin-users-summary'],
    queryFn: adminService.getUserSummaries,
    enabled: activeTab === 'devices',
  });

  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
    enabled: activeTab === 'users' && adminRole,
  });

  const { data: revenueReport } = useQuery({
    queryKey: ['admin-revenue-report', revStartDate, revEndDate],
    queryFn: () => adminService.getRevenueReport({ startDate: revStartDate, endDate: revEndDate }),
    enabled: activeTab === 'revenue' && adminRole,
  });

  const handleExportExcel = () => {
    if (!revenueReport) {
      toast.warning('Chưa có dữ liệu báo cáo để xuất');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Tong quan
    const summaryData = [
      { 'Chỉ Tiêu': 'Từ ngày', 'Giá Trị': revenueReport.startDate },
      { 'Chỉ Tiêu': 'Đến ngày', 'Giá Trị': revenueReport.endDate },
      { 'Chỉ Tiêu': 'Tổng Doanh Thu Thuần (VNĐ)', 'Giá Trị': Number(revenueReport.totalRevenue || 0) },
      { 'Chỉ Tiêu': 'Tổng Số Đơn Hàng', 'Giá Trị': Number(revenueReport.totalOrders || 0) },
      { 'Chỉ Tiêu': 'Đơn Hoàn Thành', 'Giá Trị': Number(revenueReport.completedOrders || 0) },
      { 'Chỉ Tiêu': 'Đơn Đã Hủy', 'Giá Trị': Number(revenueReport.cancelledOrders || 0) },
      { 'Chỉ Tiêu': 'Tổng Số Linh Kiện Đã Bán', 'Giá Trị': Number(revenueReport.totalItemsSold || 0) },
      { 'Chỉ Tiêu': 'Giá Trị Trung Bình / Đơn (VNĐ)', 'Giá Trị': Number(revenueReport.averageOrderValue || 0) },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Quan_Doanh_Thu');

    // Sheet 2: Linh kien da ban
    const productData = (revenueReport.productSales || []).map((p: any, idx: number) => ({
      'STT': idx + 1,
      'Mã SP': p.productId,
      'Tên Linh Kiện': p.productName,
      'Danh Mục': p.categoryName,
      'Hãng': p.brand,
      'Số Lượng Đã Bán': p.quantitySold,
      'Doanh Thu (VNĐ)': Number(p.revenue || 0),
    }));
    const ws2 = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Linh_Kien_Da_Ban');

    // Sheet 3: Chi tiet don hang
    const orderData = (revenueReport.orders || []).map((o: any, idx: number) => ({
      'STT': idx + 1,
      'Mã Đơn': o.orderCode,
      'Ngày Đặt': o.createdAt ? o.createdAt.replace('T', ' ').slice(0, 19) : '',
      'Khách Hàng': o.customerName,
      'SĐT': o.phone,
      'Phương Thức': o.paymentMethod,
      'Thanh Toán': o.paymentStatus,
      'Trạng Thái Đơn': o.orderStatus,
      'Tổng Tiền Hàng (VNĐ)': Number(o.totalAmount || 0),
      'Giảm Giá (VNĐ)': Number(o.discountAmount || 0),
      'Thành Tiền (VNĐ)': Number(o.finalAmount || 0),
    }));
    const ws3 = XLSX.utils.json_to_sheet(orderData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Chi_Tiet_Don_Hang');

    XLSX.writeFile(wb, `Bao_Cao_Doanh_Thu_${revStartDate}_den_${revEndDate}.xlsx`);
    toast.success('Đã xuất file Excel báo cáo doanh thu thành công!');
  };

  const saveDeviceMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingDevice) {
        return adminService.updateDevice(editingDevice.id, data);
      }
      return adminService.createDevice(data);
    },
    onSuccess: () => {
      refetchDevices();
      setIsDeviceModalOpen(false);
      toast.success(editingDevice ? 'Cập nhật thiết bị IoT thành công!' : 'Thêm thiết bị IoT mới thành công!');
    },
    onError: (err: any) => {
      toast.error('Lỗi thiết bị IoT: ' + (err?.response?.data?.message || err.message));
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteDevice(id),
    onSuccess: () => {
      refetchDevices();
      toast.success('Đã xóa thiết bị IoT thành công!');
    },
    onError: (err: any) => {
      toast.error('Không thể xóa thiết bị: ' + (err?.response?.data?.message || err.message));
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => adminService.createUser(data),
    onSuccess: () => {
      refetchUsers();
      setIsUserModalOpen(false);
      toast.success('Tạo tài khoản nhân viên/người dùng thành công!');
    },
    onError: (err: any) => {
      toast.error('Lỗi tạo tài khoản: ' + (err?.response?.data?.message || err.message));
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      refetchUsers();
      toast.success('Đã cập nhật phân quyền người dùng!');
    },
    onError: (err: any) => {
      toast.error('Lỗi cập nhật quyền: ' + (err?.response?.data?.message || err.message));
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminService.toggleUserStatus(id, isActive),
    onSuccess: () => {
      refetchUsers();
      toast.success('Đã cập nhật trạng thái tài khoản!');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      refetchOrders();
      queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
      if (detailOrder && updatedOrder && detailOrder.id === updatedOrder.id) {
        setDetailOrder(updatedOrder);
      }
      toast.success('Đã cập nhật trạng thái đơn hàng thành công!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.cancelOrder(id, reason),
    onSuccess: (updatedOrder) => {
      refetchOrders();
      if (detailOrder && updatedOrder && detailOrder.id === updatedOrder.id) {
        setDetailOrder(updatedOrder);
      }
      toast.success('Đã hủy đơn và hoàn trả linh kiện về kho an toàn (BR14)');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể hủy đơn hàng');
    },
  });

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await adminService.updateStock(selectedProduct.id, {
        quantity: stockAddQty,
        note: stockNote,
      });
      toast.success(`Đã nhập thêm +${stockAddQty} cho sản phẩm ${selectedProduct.name}`);
      setIsStockModalOpen(false);
      refetchProducts();
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật kho hàng');
    }
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CHO_XAC_NHAN':
        return <Badge variant="warning">Chờ xác nhận</Badge>;
      case 'DA_XAC_NHAN':
        return <Badge variant="info">Đã xác nhận</Badge>;
      case 'DANG_GIAO':
        return <Badge variant="primary">Đang giao hàng</Badge>;
      case 'DA_GIAO':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'DA_HUY':
        return <Badge variant="danger">Đã hủy</Badge>;
    }
  };

  const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fb923c', '#4ade80'];

  return (
    <div className="space-y-8">
      {/* Admin Navigation Tabs (Role-Based) */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto pb-2 text-xs font-bold uppercase tracking-wider">
        {adminRole && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Tổng Quan
          </button>
        )}
        {(adminRole || warehouseRole) && (
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Quản Lý Kho & Sản Phẩm
          </button>
        )}
        {(adminRole || warehouseRole) && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Quản Lý Đơn Hàng
          </button>
        )}
        {(adminRole || techRole) && (
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Thiết Bị IoT ({devices.length || 1})
          </button>
        )}
        {adminRole && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Phân Quyền Người Dùng
          </button>
        )}
        {adminRole && (
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Báo Cáo Doanh Thu
          </button>
        )}
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Tổng Doanh Thu</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {formatVnd(dashboard.totalRevenue)}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">
                Tháng này: {formatVnd(dashboard.monthRevenue)}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Đơn Hàng</span>
                <ShoppingCart className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {dashboard.totalOrders}
              </p>
              <p className="text-[11px] text-amber-400 font-medium">
                {dashboard.pendingOrders} đơn chờ duyệt
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Linh Kiện Trong Kho</span>
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {dashboard.productsCount}
              </p>
              <p className="text-[11px] text-rose-400 font-medium">
                {dashboard.lowStockCount} sản phẩm sắp hết
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Thiết Bị IoT Kết Nối</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {dashboard.onlineDevices} / {dashboard.totalDevices}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">Node hoạt động bình thường</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Doanh Thu 14 Ngày Gần Nhất
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.revenueByDay}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => [formatVnd(Number(val)), 'Doanh thu']}
                    />
                    <Bar dataKey="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Tỷ Trọng Doanh Thu Danh Mục
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.categoryShare}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {dashboard.categoryShare.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu..."
                value={prodSearch}
                onChange={(e) => {
                  setProdSearch(e.target.value);
                  setProdPage(0);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Tổng cộng: <strong className="text-sky-400">{productsPage?.totalElements || 0}</strong> sản phẩm
              </span>
              <Button
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    brand: '',
                    categoryId: 1,
                    price: 1000000,
                    originalPrice: 1200000,
                    stockQuantity: 20,
                    warrantyMonths: 36,
                    imageUrl: 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600&auto=format&fit=crop&q=80',
                    description: '',
                  });
                  setIsProductModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Thêm Sản Phẩm Mới
              </Button>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Linh kiện</th>
                  <th className="p-3.5">Hãng</th>
                  <th className="p-3.5">Giá bán</th>
                  <th className="p-3.5">Tồn kho</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productsPage?.content.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={prod.imageUrl}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <span className="font-bold text-slate-200 line-clamp-1">{prod.name}</span>
                        <span className="text-[11px] text-slate-400">{prod.categoryName || 'Linh kiện'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300">{prod.brand}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-100">
                      {formatVnd(prod.price)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-mono font-bold ${
                          prod.stockQuantity <= 5 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {prod.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Chỉnh sửa thông tin và link ảnh"
                          onClick={() => {
                            setEditingProduct(prod);
                            setProductForm({
                              name: prod.name,
                              brand: prod.brand,
                              categoryId: prod.categoryId || 1,
                              price: prod.price,
                              originalPrice: prod.originalPrice || prod.price,
                              stockQuantity: prod.stockQuantity,
                              warrantyMonths: prod.warrantyMonths || 24,
                              imageUrl: prod.imageUrl || '',
                              description: prod.description || '',
                            });
                            setIsProductModalOpen(true);
                          }}
                          className="h-8 px-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsStockModalOpen(true);
                          }}
                          className="h-8 text-xs"
                        >
                          Nhập Kho
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Xóa linh kiện"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa linh kiện "${prod.name}"?`)) {
                              deleteProductMutation.mutate(prod.id);
                            }
                          }}
                          className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {productsPage && productsPage.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-xs text-slate-400">
                Hiển thị trang <strong className="text-slate-200">{prodPage + 1}</strong> / {productsPage.totalPages} (Tổng số {productsPage.totalElements} sản phẩm)
              </span>
              <Pagination
                currentPage={prodPage}
                totalPages={productsPage.totalPages}
                onPageChange={(page) => setProdPage(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* 3. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'DA_GIAO', 'DA_HUY'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedOrderStatus(st)}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                  selectedOrderStatus === st
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {st === 'ALL' ? 'Tất cả đơn' : st}
              </button>
            ))}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Mã đơn</th>
                  <th className="p-3.5">Khách hàng</th>
                  <th className="p-3.5">Thanh toán</th>
                  <th className="p-3.5">Tổng tiền</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Quy trình BR14</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ordersPage?.content.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono font-bold text-sky-400">
                      <div className="flex flex-col items-start gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="hover:underline text-left"
                          title="Bấm để xem chi tiết & xác nhận đơn hàng"
                        >
                          {order.orderCode}
                        </button>
                        {/* Nút xác nhận nhanh hiển thị ngay cột đầu trên màn hình điện thoại */}
                        {order.orderStatus === 'CHO_XAC_NHAN' && (
                          <div className="flex items-center gap-1 sm:hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: order.id, status: 'DA_XAC_NHAN' })
                              }
                              className="px-2 py-1 rounded-md bg-sky-500 text-slate-950 font-sans font-bold text-[10px]"
                            >
                              ✓ Xác nhận
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailOrder(order)}
                              className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 font-sans font-semibold text-[10px]"
                            >
                              Chi tiết
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-200">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">{order.phone}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold">{order.paymentMethod}</span>
                      <span className="block text-[10px] text-slate-400">{order.paymentStatus}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-rose-400">
                      {formatVnd(order.finalAmount)}
                    </td>
                    <td className="p-3.5">{getOrderStatusBadge(order.orderStatus)}</td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailOrder(order)}
                        className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Chi tiết
                      </Button>
                      {order.orderStatus === 'CHO_XAC_NHAN' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: 'DA_XAC_NHAN' })
                            }
                          >
                            Xác Nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              cancelOrderMutation.mutate({
                                id: order.id,
                                reason: 'Hủy theo yêu cầu quản trị viên',
                              })
                            }
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {order.orderStatus === 'DA_XAC_NHAN' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: order.id, status: 'DANG_GIAO' })
                          }
                        >
                          Giao Hàng
                        </Button>
                      )}
                      {order.orderStatus === 'DANG_GIAO' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: order.id, status: 'DA_GIAO' })
                          }
                        >
                          Hoàn Tất
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DEVICES TAB (Admin & Technician CRUD) */}
      {activeTab === 'devices' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Quản Lý Node Cảm Biến & Thiết Bị IoT</h2>
              <p className="text-xs text-slate-400">Admin và Kỹ thuật viên có quyền thêm, sửa, xóa thiết bị giám sát.</p>
            </div>
            <Button
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => {
                setEditingDevice(null);
                setDeviceForm({
                  deviceCode: '',
                  deviceName: '',
                  userId: userSummaries[0]?.id || 2,
                  macAddress: '',
                  esp32Ip: '192.168.1.105',
                  roomLocation: 'Phòng kỹ thuật',
                });
                setIsDeviceModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Thêm Thiết Bị IoT
            </Button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Mã Node</th>
                  <th className="p-3.5">Tên thiết bị</th>
                  <th className="p-3.5">Chủ sở hữu (Tài khoản)</th>
                  <th className="p-3.5">ESP32 IP / MAC</th>
                  <th className="p-3.5">Vị trí phòng</th>
                  <th className="p-3.5">Trạng thái (Auto)</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono font-bold text-sky-400">{d.deviceCode}</td>
                    <td className="p-3.5 font-bold text-slate-200">{d.deviceName}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-indigo-300">{d.ownerName || 'Chưa gán'}</span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="text-emerald-400">{d.esp32Ip || '192.168.1.105'}</div>
                      <div className="text-slate-500">{d.macAddress || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">{d.roomLocation || 'Phòng kỹ thuật'}</td>
                    <td className="p-3.5">
                      <Badge variant={d.status === 'ONLINE' ? 'success' : d.status === 'WARNING' ? 'warning' : 'danger'}>
                        {d.status}
                      </Badge>
                      {d.lastPing && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Ping: {d.lastPing.replace('T', ' ').slice(0, 19)}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          title="Xem thông số & Lấy code nạp ESP32 (Wokwi / Arduino)"
                          onClick={() => setConfigDevice(d)}
                          className="h-8 px-2.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          Nạp ESP32
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Chỉnh sửa thiết bị IoT"
                          onClick={() => {
                            setEditingDevice(d);
                            setDeviceForm({
                              deviceCode: d.deviceCode,
                              deviceName: d.deviceName,
                              userId: d.userId || userSummaries[0]?.id || 2,
                              macAddress: d.macAddress || '',
                              esp32Ip: d.esp32Ip || '',
                              roomLocation: d.roomLocation || '',
                            });
                            setIsDeviceModalOpen(true);
                          }}
                          className="h-8 px-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Xóa thiết bị IoT"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${d.deviceName}" (${d.deviceCode})?`)) {
                              deleteDeviceMutation.mutate(d.id);
                            }
                          }}
                          className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4.5 USERS & PERMISSIONS TAB (Admin Only) */}
      {activeTab === 'users' && adminRole && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Quản Lý Tài Khoản & Phân Quyền Hệ Thống</h2>
              <p className="text-xs text-slate-400">
                Admin toàn quyền • Quản lý Kho (Kho & Đơn hàng) • Kỹ thuật viên (Thiết bị IoT) • Khách hàng.
              </p>
            </div>
            <Button
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => {
                setUserForm({
                  username: '',
                  password: '',
                  fullName: '',
                  email: '',
                  phone: '',
                  role: 'ROLE_WAREHOUSE',
                });
                setIsUserModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4" />
              Thêm Nhân Viên / Tài Khoản
            </Button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Tài khoản</th>
                  <th className="p-3.5">Họ & Tên</th>
                  <th className="p-3.5">Email / SĐT</th>
                  <th className="p-3.5">Vai trò (Phân quyền)</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Khóa / Mở</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono text-slate-400">#{u.id}</td>
                    <td className="p-3.5 font-mono font-bold text-sky-400">{u.username}</td>
                    <td className="p-3.5 font-bold text-slate-200">{u.fullName}</td>
                    <td className="p-3.5 text-slate-300">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone || 'Chưa có SĐT'}</div>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRoleMutation.mutate({ id: u.id, role: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="ROLE_ADMIN">Admin (Toàn quyền)</option>
                        <option value="ROLE_WAREHOUSE">Nhân viên Quản lý Kho</option>
                        <option value="ROLE_TECHNICIAN">Nhân viên Kỹ thuật IoT</option>
                        <option value="ROLE_CUSTOMER">Khách hàng</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        onClick={() => toggleUserStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        className={`h-8 px-2 ${u.isActive ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REVENUE TAB (Báo Cáo Doanh Thu Chuẩn + Xuất Excel + Xuất Hóa Đơn) */}
      {activeTab === 'revenue' && adminRole && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Toolbar: Chọn ngày & Xuất Excel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Từ ngày:</span>
                <input
                  type="date"
                  value={revStartDate}
                  onChange={(e) => setRevStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                <span>Đến ngày:</span>
                <input
                  type="date"
                  value={revEndDate}
                  onChange={(e) => setRevEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 font-bold"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Báo Cáo Excel (.xlsx)
            </Button>
          </div>

          {revenueReport && (
            <>
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Tổng Doanh Thu Thuần</span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {formatVnd(Number(revenueReport.totalRevenue || 0))}
                  </p>
                  <p className="text-[11px] text-slate-500">Không tính đơn đã hủy</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Tổng Số Đơn Hàng</span>
                  <p className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                    {revenueReport.totalOrders} đơn
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Hoàn thành: <strong className="text-emerald-400">{revenueReport.completedOrders}</strong> • Hủy: <strong className="text-rose-400">{revenueReport.cancelledOrders}</strong>
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Linh Kiện Đã Bán</span>
                  <p className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
                    {revenueReport.totalItemsSold} chiếc
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Trên {revenueReport.productSales?.length || 0} mã sản phẩm khác nhau
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Giá Trị TB / Đơn</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {formatVnd(Number(revenueReport.averageOrderValue || 0))}
                  </p>
                  <p className="text-[11px] text-slate-500">Trong kỳ thống kê</p>
                </div>
              </div>

              {/* Biểu đồ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Doanh Thu Theo Ngày ({revenueReport.startDate} đến {revenueReport.endDate})
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueReport.revenueByDay}>
                        <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                          formatter={(val: any) => [formatVnd(Number(val)), 'Doanh thu']}
                        />
                        <Bar dataKey="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Tỷ Trọng Danh Mục Bán Ra
                  </h3>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueReport.categoryShare}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                        >
                          {(revenueReport.categoryShare || []).map((_: any, index: number) => (
                            <Cell key={`cell-rev-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                          formatter={(val: any) => [formatVnd(Number(val)), 'Doanh thu']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bảng Thống Kê Linh Kiện Đã Bán */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Thống Kê Doanh Thu Theo Từng Linh Kiện Đã Bán
                  </h3>
                  <span className="text-xs text-slate-400">
                    Tổng: <strong>{revenueReport.productSales?.length || 0}</strong> mặt hàng phát sinh doanh số
                  </span>
                </div>
                <table className="w-full text-xs text-left divide-y divide-slate-800">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Linh kiện</th>
                      <th className="p-3.5">Danh mục</th>
                      <th className="p-3.5">Hãng</th>
                      <th className="p-3.5 text-center">Số lượng bán</th>
                      <th className="p-3.5 text-right">Doanh thu mang lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {revenueReport.productSales && revenueReport.productSales.length > 0 ? (
                      revenueReport.productSales.map((ps: any) => (
                        <tr key={ps.productId} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-bold text-slate-200">{ps.productName}</td>
                          <td className="p-3.5 text-slate-400">{ps.categoryName}</td>
                          <td className="p-3.5 text-slate-300">{ps.brand}</td>
                          <td className="p-3.5 text-center font-mono font-bold text-sky-400">{ps.quantitySold}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                            {formatVnd(Number(ps.revenue || 0))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          Chưa có linh kiện nào được bán trong khoảng thời gian này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bảng Chi Tiết Đơn Hàng & Xuất Hóa Đơn */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Danh Sách Đơn Hàng & Xuất Hóa Đơn Bán Hàng
                  </h3>
                  <span className="text-xs text-slate-400">
                    Tổng: <strong>{revenueReport.orders?.length || 0}</strong> đơn
                  </span>
                </div>
                <table className="w-full text-xs text-left divide-y divide-slate-800">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3.5">Mã đơn</th>
                      <th className="p-3.5">Ngày đặt</th>
                      <th className="p-3.5">Khách hàng</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Thành tiền</th>
                      <th className="p-3.5 text-right">Hóa đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {revenueReport.orders && revenueReport.orders.length > 0 ? (
                      revenueReport.orders.map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-slate-900/40">
                          <td className="p-3.5 font-mono font-bold text-sky-400">{ord.orderCode}</td>
                          <td className="p-3.5 text-slate-400">
                            {ord.createdAt ? ord.createdAt.replace('T', ' ').slice(0, 16) : ''}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-slate-200">{ord.customerName}</p>
                            <p className="text-[11px] text-slate-400">{ord.phone}</p>
                          </td>
                          <td className="p-3.5">{getOrderStatusBadge(ord.orderStatus)}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                            {formatVnd(Number(ord.finalAmount || 0))}
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInvoiceOrder(ord)}
                              className="h-8 text-xs inline-flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5 text-sky-400" />
                              Xuất Hóa Đơn
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          Không có đơn hàng nào trong khoảng thời gian này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Nhập kho thêm: ${selectedProduct?.name}`}
      >
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <Input
            label="Số lượng nhập thêm *"
            type="number"
            min="1"
            value={stockAddQty}
            onChange={(e) => setStockAddQty(Number(e.target.value))}
            required
          />
          <Input
            label="Ghi chú chứng từ nhập kho"
            value={stockNote}
            onChange={(e) => setStockNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsStockModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Xác Nhận Nhập Kho</Button>
          </div>
        </form>
      </Modal>
      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Chỉnh sửa: ${editingProduct.name}` : 'Thêm Linh Kiện Mới Vào Hệ Thống'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProductMutation.mutate(productForm);
          }}
          className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Tên linh kiện *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="VD: Card Màn Hình RTX 4070 SUPER..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Hãng sản xuất (Brand) *</label>
              <input
                type="text"
                required
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                placeholder="VD: ASUS, MSI, Intel..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Danh mục linh kiện *</label>
              <select
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value={1}>Vi xử lý (CPU)</option>
                <option value={2}>Bo mạch chủ (Mainboard)</option>
                <option value={3}>Bộ nhớ trong (RAM)</option>
                <option value={4}>Card màn hình (VGA)</option>
                <option value={5}>Ổ cứng lưu trữ (SSD)</option>
                <option value={6}>Nguồn máy tính (PSU)</option>
                <option value={7}>Tản nhiệt (Cooler)</option>
                <option value={8}>Vỏ máy tính (Case)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Giá bán (VND) *</label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Giá gốc niêm yết (VND)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={productForm.originalPrice}
                onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Số lượng tồn kho *</label>
              <input
                type="number"
                min="0"
                required
                value={productForm.stockQuantity}
                onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Bảo hành (tháng)</label>
              <input
                type="number"
                min="0"
                value={productForm.warrantyMonths}
                onChange={(e) => setProductForm({ ...productForm, warrantyMonths: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Link ảnh sản phẩm (có thể lấy link từ web khác)</label>
            <input
              type="url"
              value={productForm.imageUrl}
              onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
            {productForm.imageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={productForm.imageUrl}
                  alt="Xem trước ảnh"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-700 bg-slate-950"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="text-[11px] text-slate-400">Xem trước hình ảnh sản phẩm</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mô tả sản phẩm</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Thông số, tính năng nổi bật..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsProductModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveProductMutation.isPending}>
              {saveProductMutation.isPending ? 'Đang lưu...' : editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Create / Edit IoT Device Modal */}
      <Modal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title={editingDevice ? `Chỉnh sửa thiết bị: ${editingDevice.deviceCode}` : 'Thêm Thiết Bị IoT Mới'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveDeviceMutation.mutate(deviceForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Mã thiết bị (Node Code) *</label>
              <input
                type="text"
                required
                disabled={!!editingDevice}
                value={deviceForm.deviceCode}
                onChange={(e) => setDeviceForm({ ...deviceForm, deviceCode: e.target.value.toUpperCase() })}
                placeholder="VD: PC-LAB-02"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Gán cho Tài khoản Người dùng *</label>
              <select
                value={deviceForm.userId}
                onChange={(e) => setDeviceForm({ ...deviceForm, userId: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {userSummaries.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300">
            Trạng thái <strong>ONLINE / OFFLINE</strong> sẽ tự động cập nhật theo tín hiệu từ phần mềm Desktop trên máy của người dùng (mặc định ban đầu: OFFLINE).
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Tên thiết bị *</label>
            <input
              type="text"
              required
              value={deviceForm.deviceName}
              onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
              placeholder="VD: Máy trạm Workstation Phòng Lab"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Địa chỉ MAC</label>
              <input
                type="text"
                value={deviceForm.macAddress}
                onChange={(e) => setDeviceForm({ ...deviceForm, macAddress: e.target.value })}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">IP ESP32</label>
              <input
                type="text"
                value={deviceForm.esp32Ip}
                onChange={(e) => setDeviceForm({ ...deviceForm, esp32Ip: e.target.value })}
                placeholder="192.168.1.105"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Vị trí phòng / Khu vực</label>
            <input
              type="text"
              value={deviceForm.roomLocation}
              onChange={(e) => setDeviceForm({ ...deviceForm, roomLocation: e.target.value })}
              placeholder="Phòng kỹ thuật"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsDeviceModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saveDeviceMutation.isPending}>
              {saveDeviceMutation.isPending ? 'Đang lưu...' : editingDevice ? 'Lưu Thay Đổi' : 'Thêm Thiết Bị'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User / Staff Modal (Admin Only) */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Tạo Tài Khoản Nhân Viên / Phân Quyền"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const normalizedEmail = userForm.email.trim().toLowerCase();
            if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(normalizedEmail)) {
              toast.error('Email bắt buộc phải có định dạng @gmail.com');
              return;
            }
            const normalizedPhone = userForm.phone.trim();
            if (normalizedPhone && !/^0\d{9}$/.test(normalizedPhone)) {
              toast.error('Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0');
              return;
            }
            createUserMutation.mutate({
              ...userForm,
              email: normalizedEmail,
              phone: normalizedPhone,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tên đăng nhập *</label>
              <input
                type="text"
                required
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="VD: kho_01"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Mật khẩu *</label>
              <input
                type="password"
                required
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="******"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Họ và tên *</label>
            <input
              type="text"
              required
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email *</label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="nhanvien@linhkieniot.vn"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Số điện thoại</label>
              <input
                type="text"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="0909..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Vai trò phân quyền *</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="ROLE_WAREHOUSE">Nhân viên Quản lý Kho</option>
              <option value="ROLE_TECHNICIAN">Nhân viên Kỹ thuật IoT</option>
              <option value="ROLE_ADMIN">Quản trị viên (Admin toàn quyền)</option>
              <option value="ROLE_CUSTOMER">Khách hàng</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsUserModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? 'Đang tạo...' : 'Tạo Tài Khoản'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Printable Invoice Modal */}
      <Modal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        title={`Hóa Đơn Bán Hàng - ${invoiceOrder?.orderCode || ''}`}
      >
        {invoiceOrder && (
          <div className="space-y-4">
            <div id="printable-invoice" className="bg-white text-slate-900 rounded-xl p-5 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900">LINHKIEN IOT·AI TECH STORE</h2>
                  <p className="text-[11px] text-slate-600">236 Lê Văn Sỹ, Q. Tân Bình, TP.HCM</p>
                  <p className="text-[11px] text-slate-600">Hotline: 0912 345 678</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm uppercase text-sky-700">HÓA ĐƠN BÁN HÀNG</p>
                  <p className="font-mono font-bold">#{invoiceOrder.orderCode}</p>
                  <p className="text-[11px] text-slate-500">
                    Ngày: {invoiceOrder.createdAt ? invoiceOrder.createdAt.replace('T', ' ').slice(0, 16) : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-lg">
                <div>
                  <p><strong className="text-slate-700">Khách hàng:</strong> {invoiceOrder.customerName}</p>
                  <p><strong className="text-slate-700">SĐT:</strong> {invoiceOrder.phone}</p>
                </div>
                <div>
                  <p><strong className="text-slate-700">Địa chỉ:</strong> {invoiceOrder.shippingAddress}, {invoiceOrder.city}</p>
                  <p><strong className="text-slate-700">Thanh toán:</strong> {invoiceOrder.paymentMethod} ({invoiceOrder.paymentStatus})</p>
                </div>
              </div>

              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-left font-bold text-slate-700">
                    <th className="py-2">Sản phẩm</th>
                    <th className="py-2 text-center">SL</th>
                    <th className="py-2 text-right">Đơn giá</th>
                    <th className="py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(invoiceOrder.items || []).map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium">{it.productName}</td>
                      <td className="py-2 text-center font-mono">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">{formatVnd(Number(it.unitPrice || 0))}</td>
                      <td className="py-2 text-right font-mono font-bold">{formatVnd(Number(it.subtotal || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-300 pt-3 space-y-1 text-right text-xs">
                <p>Tạm tính: <span className="font-mono font-semibold">{formatVnd(Number(invoiceOrder.totalAmount || 0))}</span></p>
                {Number(invoiceOrder.discountAmount || 0) > 0 && (
                  <p className="text-emerald-700">Giảm giá ({invoiceOrder.couponCode}): <span className="font-mono">-{formatVnd(Number(invoiceOrder.discountAmount))}</span></p>
                )}
                <p>Phí vận chuyển: <span className="font-mono">{formatVnd(Number(invoiceOrder.shippingFee || 0))}</span></p>
                <p className="text-sm font-black text-rose-600 pt-1">
                  TỔNG THANH TOÁN: <span className="font-mono">{formatVnd(Number(invoiceOrder.finalAmount || 0))}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setInvoiceOrder(null)}>
                Đóng
              </Button>
              <Button
                onClick={() => {
                  const printContent = document.getElementById('printable-invoice')?.innerHTML;
                  if (!printContent) return;
                  const win = window.open('', '_blank', 'width=800,height=700');
                  if (win) {
                    win.document.write(`<html><head><title>Hóa Đơn ${invoiceOrder.orderCode}</title><style>body{font-family:Arial,sans-serif;padding:24px;} table{width:100%;border-collapse:collapse;} th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;}</style></head><body>${printContent}</body></html>`);
                    win.document.close();
                    win.focus();
                    win.print();
                  }
                }}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In Hóa Đơn / Lưu PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Detail Modal (Customer, Items, Warranty) */}
      <Modal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Chi Tiết Đơn Hàng - ${detailOrder?.orderCode || ''}`}
      >
        {detailOrder && (
          <div className="space-y-4 text-xs">
            {/* Header Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-400">Mã đơn hàng</p>
                <p className="font-mono font-bold text-sm text-sky-400">#{detailOrder.orderCode}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-400">Ngày đặt hàng</p>
                <p className="font-medium text-slate-200">
                  {detailOrder.createdAt ? detailOrder.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[11px] text-slate-400">Trạng thái đơn</p>
                <div>{getOrderStatusBadge(detailOrder.orderStatus)}</div>
              </div>
            </div>

            {/* Customer & Payment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Thông Tin Khách Hàng
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <p className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold text-white">{detailOrder.customerName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono">{detailOrder.phone}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      {detailOrder.shippingAddress}
                      {detailOrder.city ? `, ${detailOrder.city}` : ''}
                    </span>
                  </p>
                  {detailOrder.note && (
                    <p className="flex items-start gap-2 text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1">
                      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Ghi chú: {detailOrder.note}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Thanh Toán & Giao Dịch
                </h4>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phương thức:</span>
                    <span className="font-semibold text-slate-100">{detailOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạng thái TT:</span>
                    <span
                      className={`font-semibold ${
                        detailOrder.paymentStatus === 'PAID'
                          ? 'text-emerald-400'
                          : detailOrder.paymentStatus === 'REFUNDED'
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {detailOrder.paymentStatus}
                    </span>
                  </div>
                  {detailOrder.couponCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mã giảm giá:</span>
                      <span className="font-mono font-bold text-emerald-400">{detailOrder.couponCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cập nhật cuối:</span>
                    <span>
                      {detailOrder.updatedAt ? detailOrder.updatedAt.replace('T', ' ').slice(0, 16) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products & Warranty Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
              <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Chi Tiết Linh Kiện & Bảo Hành ({detailOrder.items?.length || 0} sản phẩm)
                </span>
              </div>
              <div className="divide-y divide-slate-800/70 max-h-64 overflow-y-auto">
                {(detailOrder.items || []).map((it, idx) => {
                  const warrantyMonths = it.warrantyMonths ?? 12;
                  let expiryText = `${warrantyMonths} tháng`;
                  let warrantyStatusEl = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Kích hoạt khi giao ({warrantyMonths}T)
                    </span>
                  );

                  if (detailOrder.orderStatus === 'DA_HUY') {
                    warrantyStatusEl = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Đơn đã hủy
                      </span>
                    );
                  } else if (detailOrder.createdAt) {
                    const start = new Date(detailOrder.createdAt);
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + warrantyMonths);
                    const formattedEnd = end.toLocaleDateString('vi-VN');
                    expiryText = `${warrantyMonths} tháng (đến ${formattedEnd})`;

                    if (detailOrder.orderStatus === 'DA_GIAO') {
                      const isValid = end >= new Date();
                      warrantyStatusEl = isValid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Còn bảo hành • đến {formattedEnd}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/60 text-slate-400 border border-slate-600">
                          Hết hạn bảo hành ({formattedEnd})
                        </span>
                      );
                    }
                  }

                  return (
                    <div key={it.id || idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/60">
                      <div className="flex items-center gap-3 min-w-0">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.productName}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-slate-100 truncate">{it.productName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>
                              SL: <strong className="text-slate-200 font-mono">{it.quantity}</strong> ×{' '}
                              <span className="font-mono">{formatVnd(Number(it.unitPrice || 0))}</span>
                            </span>
                            <span>•</span>
                            <span title={expiryText}>{warrantyStatusEl}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-rose-400">
                          {formatVnd(Number(it.subtotal || 0))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-right">
              <p className="text-slate-400">
                Tạm tính:{' '}
                <span className="font-mono font-semibold text-slate-200">
                  {formatVnd(Number(detailOrder.totalAmount || 0))}
                </span>
              </p>
              {Number(detailOrder.discountAmount || 0) > 0 && (
                <p className="text-emerald-400">
                  Giảm giá {detailOrder.couponCode ? `(${detailOrder.couponCode})` : ''}:{' '}
                  <span className="font-mono">-{formatVnd(Number(detailOrder.discountAmount))}</span>
                </p>
              )}
              <p className="text-slate-400">
                Phí vận chuyển:{' '}
                <span className="font-mono text-slate-200">
                  {formatVnd(Number(detailOrder.shippingFee || 0))}
                </span>
              </p>
              <p className="text-sm font-black text-rose-400 pt-1 border-t border-slate-800">
                TỔNG THANH TOÁN:{' '}
                <span className="font-mono">{formatVnd(Number(detailOrder.finalAmount || 0))}</span>
              </p>
            </div>

            {/* Order Status Transition Actions right inside Modal (Convenient for Mobile & Desktop) */}
            {(detailOrder.orderStatus === 'CHO_XAC_NHAN' ||
              detailOrder.orderStatus === 'DA_XAC_NHAN' ||
              detailOrder.orderStatus === 'DANG_GIAO') && (
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-sky-300 text-xs uppercase tracking-wider">
                    Xử Lý Quy Trình Đơn Hàng (BR14)
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {detailOrder.orderStatus === 'CHO_XAC_NHAN'
                      ? 'Xác nhận đơn hàng để duyệt xuất kho và tự động cấp thiết bị IoT ESP32 (nếu là bộ PC).'
                      : detailOrder.orderStatus === 'DA_XAC_NHAN'
                      ? 'Đơn đã được xác nhận. Bấm Giao Hàng khi bàn giao cho đơn vị vận chuyển.'
                      : 'Đơn đang giao. Bấm Hoàn Tất khi khách hàng đã nhận hàng thành công.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {detailOrder.orderStatus === 'CHO_XAC_NHAN' && (
                    <>
                      <Button
                        size="sm"
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({ id: detailOrder.id, status: 'DA_XAC_NHAN' })
                        }
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Xác Nhận Đơn
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={cancelOrderMutation.isPending}
                        onClick={() =>
                          cancelOrderMutation.mutate({
                            id: detailOrder.id,
                            reason: 'Hủy theo yêu cầu quản trị viên',
                          })
                        }
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Hủy Đơn
                      </Button>
                    </>
                  )}
                  {detailOrder.orderStatus === 'DA_XAC_NHAN' && (
                    <Button
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({ id: detailOrder.id, status: 'DANG_GIAO' })
                      }
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" />
                      Chuyển Giao Hàng
                    </Button>
                  )}
                  {detailOrder.orderStatus === 'DANG_GIAO' && (
                    <Button
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({ id: detailOrder.id, status: 'DA_GIAO' })
                      }
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Hoàn Tất Đơn
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setDetailOrder(null)}>
                Đóng
              </Button>
              <Button
                onClick={() => {
                  const target = detailOrder;
                  setDetailOrder(null);
                  setInvoiceOrder(target);
                }}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Xem & In Hóa Đơn
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ESP32 Firmware & Wokwi Config Modal (For Technician / Admin) */}
      <Modal
        isOpen={!!configDevice}
        onClose={() => setConfigDevice(null)}
        title={`Cấu Hình & Nạp Code ESP32: ${configDevice?.deviceCode || ''}`}
      >
        {configDevice && (() => {
          const codeSnippet = `#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define DHTPIN 15
#define DHTTYPE DHT22
#define DUST_PIN 34
DHT dht(DHTPIN, DHTTYPE);

// WiFi (Dùng "Wokwi-GUEST" nếu test Wokwi, hoặc tên WiFi nhà khách nếu nạp mạch thật)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Broker đồng bộ với Server Web & App Desktop
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Mã Node & Topic tự động cấp cho đơn hàng này
const char* DEVICE_ID  = "${configDevice.deviceCode}";
const char* mqtt_topic = "iot/environment/${configDevice.deviceCode}";

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

void setup_wifi() {
  delay(10);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32_${configDevice.deviceCode}_" + String(random(0xffff), HEX);
    if (!client.connect(clientId.c_str())) delay(3000);
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(DUST_PIN, INPUT);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  if (millis() - lastMsg > 2000) {
    lastMsg = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (isnan(t) || isnan(h)) return;
    float dust = round((analogRead(DUST_PIN) / 4095.0) * 300.0 * 10) / 10.0;
    StaticJsonDocument<256> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["ambientTemp"] = round(t * 10) / 10.0;
    doc["ambientHumidity"] = round(h * 10) / 10.0;
    doc["dustDensity"] = dust;
    char buf[256];
    serializeJson(doc, buf);
    client.publish(mqtt_topic, buf);
  }
}`;
          return (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div>
                  <span className="text-slate-400">Mã Node (Device ID):</span>
                  <p className="font-mono font-bold text-sky-400 text-sm">{configDevice.deviceCode}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tài khoản sở hữu:</span>
                  <p className="font-bold text-indigo-300">{configDevice.ownerName || 'Chưa gán'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">MQTT Broker & Topic:</span>
                  <p className="font-mono text-emerald-400">
                    tcp://broker.hivemq.com:1883 → iot/environment/{configDevice.deviceCode}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Code Firmware ESP32 (Dán vào Wokwi hoặc Arduino IDE):</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippet);
                      toast.success(`Đã copy code ESP32 cho mã ${configDevice.deviceCode}!`);
                    }}
                    className="h-7 text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Code
                  </Button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 overflow-y-auto">
                  {codeSnippet}
                </pre>
              </div>

              <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                <strong>Quy trình kỹ thuật:</strong> Copy code trên dán vào Wokwi (hoặc nạp mạch ESP32 thật bằng Arduino IDE) → Chạy test kiểm tra nhiệt độ phòng → Đóng gói ESP32 gửi kèm bộ PC cho khách hàng.
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setConfigDevice(null)}>Đóng</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
