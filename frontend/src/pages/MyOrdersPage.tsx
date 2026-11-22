import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Clock, CheckCircle2, Activity, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderService } from '@/services/orderService';
import { OrderDto, OrderStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const MyOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderService.getMyOrders,
    refetchInterval: 6000,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId, 'Khách hàng hủy đơn'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Đã hủy đơn hàng và hoàn trả linh kiện về kho');
    },
  });

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'CHO_XAC_NHAN': return <Badge variant="warning">Chờ xác nhận</Badge>;
      case 'DA_XAC_NHAN': return <Badge variant="info">Đã xác nhận</Badge>;
      case 'DANG_GIAO': return <Badge variant="primary">Đang giao hàng</Badge>;
      case 'DA_GIAO': return <Badge variant="success">Hoàn thành</Badge>;
      case 'DA_HUY': return <Badge variant="danger">Đã hủy</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi tiến độ giao hàng và thông tin chi tiết từng đơn hàng
          </p>
        </div>
        <Link to="/" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Mua sắm tiếp
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải lịch sử đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300">Bạn chưa có đơn hàng nào</p>
          <Link to="/" className="inline-block text-xs text-sky-400 hover:underline">
            Khám phá linh kiện ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {order.orderCode}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {order.createdAt ? order.createdAt.substring(0, 10) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.orderStatus)}
                  {order.orderStatus === 'CHO_XAC_NHAN' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => cancelMutation.mutate(order.id)}
                      isLoading={cancelMutation.isPending}
                    >
                      Hủy Đơn
                    </Button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-slate-300">
                    <span className="truncate max-w-md">
                      {item.productName} <span className="text-slate-500">× {item.quantity}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatVnd(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trạng thái Chờ Xác Nhận vs Đã Xác Nhận & Cấp Thiết Bị IoT */}
              {order.orderStatus === 'CHO_XAC_NHAN' ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-300">
                      Đang chờ Nhân viên / Quản trị viên xác nhận đơn hàng
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Vui lòng đợi hệ thống duyệt đơn. Nếu đơn hàng là bộ PC lắp ráp, hệ thống sẽ tự động sinh 1 thiết bị Node IoT ESP32 gắn vào tài khoản ngay khi đơn được xác nhận.
                    </p>
                  </div>
                </div>
              ) : (
                order.note &&
                order.note.includes('Mã Node IoT:') && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-emerald-400">
                          Đơn hàng Bộ PC đã được xác nhận & Tự động cấp Thiết bị IoT!
                        </p>
                        <p className="text-[11px] text-slate-200">{order.note}</p>
                      </div>
                    </div>
                    <Link
                      to="/iot"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shrink-0 transition"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Mở IoT Live
                    </Link>
                  </div>
                )
              )}

              {/* Footer Total */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-xs">
                <span className="text-slate-400">
                  Phương thức: <strong className="text-slate-200">{order.paymentMethod}</strong>
                </span>
                <div className="text-right">
                  <span className="text-slate-400 mr-2">Tổng tiền:</span>
                  <span className="text-base font-black text-rose-400 font-mono">
                    {formatVnd(order.finalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
