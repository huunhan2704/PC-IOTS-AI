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
} from 'lucide-react';
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
import { toast } from 'sonner';

export const frm_AdminQuanTri: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'devices' | 'revenue'>('dashboard');

  // Products Tab State
  const [prodSearch, setProdSearch] = useState('');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
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
    queryKey: ['admin-products', prodSearch],
    queryFn: () => adminService.getProducts({ keyword: prodSearch, size: 20 }),
    enabled: activeTab === 'products',
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

  const { data: devices = [] } = useQuery({
    queryKey: ['admin-devices'],
    queryFn: adminService.getDevices,
    enabled: activeTab === 'devices',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      refetchOrders();
      toast.success('Đã cập nhật trạng thái đơn hàng');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.cancelOrder(id, reason),
    onSuccess: () => {
      refetchOrders();
      toast.success('Đã hủy đơn và hoàn trả linh kiện về kho an toàn (BR14)');
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
      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto pb-2 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition ${
            activeTab === 'dashboard'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Tổng Quan
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Quản Lý Sản Phẩm
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Quản Lý Đơn Hàng
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition ${
            activeTab === 'devices'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Quản Lý Đội IoT
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition ${
            activeTab === 'revenue'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Báo Cáo Doanh Thu
        </button>
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
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
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
                      />
                      <span className="font-bold text-slate-200 line-clamp-1">{prod.name}</span>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(prod);
                          setIsStockModalOpen(true);
                        }}
                      >
                        Nhập Kho
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
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
                    <td className="p-3.5 font-mono font-bold text-sky-400">{order.orderCode}</td>
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
                    <td className="p-3.5 text-right space-x-1.5">
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

      {/* 4. DEVICES TAB */}
      {activeTab === 'devices' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Mã Node</th>
                  <th className="p-3.5">Tên thiết bị</th>
                  <th className="p-3.5">Địa chỉ MAC</th>
                  <th className="p-3.5">ESP32 IP</th>
                  <th className="p-3.5">Vị trí phòng</th>
                  <th className="p-3.5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono font-bold text-sky-400">{d.deviceCode}</td>
                    <td className="p-3.5 font-bold text-slate-200">{d.deviceName}</td>
                    <td className="p-3.5 font-mono text-slate-400">{d.macAddress || 'N/A'}</td>
                    <td className="p-3.5 font-mono text-emerald-400">{d.esp32Ip || '192.168.1.105'}</td>
                    <td className="p-3.5 text-slate-300">{d.roomLocation || 'Phòng thực hành'}</td>
                    <td className="p-3.5">
                      <Badge variant={d.status === 'ONLINE' ? 'success' : 'danger'}>
                        {d.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REVENUE TAB */}
      {activeTab === 'revenue' && dashboard && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Doanh Thu Theo Tháng (6 Tháng Gần Nhất)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.revenueByMonth}>
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
    </div>
  );
};
