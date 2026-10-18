import React, { useState } from 'react';
import { Search, PackageCheck, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { orderService } from '@/services/orderService';
import { OrderDto } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const OrderTrackingPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await orderService.trackOrder(orderCode.trim().toUpperCase());
      setOrder(res);
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          Tra Cứu Đơn Hàng
        </h1>
        <p className="text-xs text-slate-400">
          Nhập mã đơn hàng (ví dụ: LK261015A01) để kiểm tra trạng thái vận chuyển và thông tin linh kiện
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Nhập mã đơn hàng (LK...)"
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value)}
          className="uppercase font-mono"
          required
        />
        <Button type="submit" isLoading={isLoading}>
          <Search className="w-4 h-4 mr-1.5" />
          Tra Cứu
        </Button>
      </form>

      {hasSearched && !isLoading && !order && (
        <div className="py-12 text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          Không tìm thấy đơn hàng nào với mã trên. Vui lòng kiểm tra lại!
        </div>
      )}

      {order && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Mã đơn hàng</span>
              <span className="font-mono font-bold text-sky-400 text-base">{order.orderCode}</span>
            </div>
            <Badge variant="primary">{order.orderStatus}</Badge>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider">Danh sách linh kiện:</h4>
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between text-slate-300">
                <span>{i.productName} × {i.quantity}</span>
                <span className="font-mono font-bold">{formatVnd(i.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline text-xs">
            <span className="text-slate-400">Tổng thanh toán:</span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {formatVnd(order.finalAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
