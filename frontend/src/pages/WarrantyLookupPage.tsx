import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  AlertCircle,
  RefreshCw,
  Wrench,
  FileCheck2,
  PhoneCall,
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/authStore';
import { OrderDto } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const WarrantyLookupPage: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [myOrders, setMyOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      orderService
        .getMyOrders()
        .then((res) => setMyOrders(res || []))
        .catch(() => setMyOrders([]));
    }
  }, [isAuthenticated]);

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

  const handleQuickSelect = (selected: OrderDto) => {
    setOrderCode(selected.orderCode);
    setOrder(selected);
    setHasSearched(true);
  };

  const getWarrantyDetails = (ord: OrderDto, warrantyMonths?: number) => {
    const months = warrantyMonths ?? 12;
    if (ord.orderStatus === 'DA_HUY') {
      return {
        months,
        expiryDateStr: '—',
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Đơn đã hủy
          </span>
        ),
      };
    }

    const start = ord.createdAt ? new Date(ord.createdAt) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    const expiryDateStr = end.toLocaleDateString('vi-VN');

    if (ord.orderStatus !== 'DA_GIAO') {
      return {
        months,
        expiryDateStr: `Dự kiến ${expiryDateStr}`,
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Chờ kích hoạt khi giao
          </span>
        ),
      };
    }

    const isValid = end >= new Date();
    return {
      months,
      expiryDateStr,
      badge: isValid ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Còn bảo hành
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-400 border border-slate-600">
          <AlertCircle className="w-3 h-3" />
          Hết hạn bảo hành
        </span>
      ),
    };
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              TRUNG TÂM BẢO HÀNH ĐIỆN TỬ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bảo Hành & Tra Cứu Thông Tin Bảo Hành
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Kiểm tra thời hạn bảo hành chính hãng của từng linh kiện theo mã đơn hàng, theo dõi trạng thái kích hoạt bảo hành điện tử và xem quy trình tiếp nhận bảo hành tại LinhKiện IoT·AI.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <PhoneCall className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Hotline Bảo Hành</p>
              <p className="text-base font-black font-mono text-white">0912 345 678</p>
              <p className="text-[11px] text-emerald-400">8:00 - 21:00 (T2 - CN)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lookup Form */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Tra cứu bảo hành theo mã đơn hàng
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nhập mã đơn hàng (ví dụ: <span className="font-mono text-sky-400">LK261015A01</span>) để xem thời hạn bảo hành của từng linh kiện trong đơn.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <Input
            placeholder="Nhập mã đơn hàng (ví dụ: LK261015A01)..."
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="uppercase font-mono flex-1"
            required
          />
          <Button type="submit" isLoading={isLoading} className="shrink-0">
            <Search className="w-4 h-4 mr-1.5" />
            Tra Cứu Bảo Hành
          </Button>
        </form>

        {/* Quick pick from logged-in user's orders */}
        {isAuthenticated && myOrders.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Đơn hàng của bạn (bấm để tra cứu nhanh):
            </p>
            <div className="flex flex-wrap gap-2">
              {myOrders.slice(0, 6).map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => handleQuickSelect(ord)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                    order?.orderCode === ord.orderCode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-sky-400 border-slate-800 hover:border-sky-500/40'
                  }`}
                >
                  #{ord.orderCode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Not Found */}
      {hasSearched && !isLoading && !order && (
        <div className="py-10 px-4 text-center text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          Không tìm thấy thông tin đơn hàng/bảo hành với mã <strong>{orderCode.toUpperCase()}</strong>. Vui lòng kiểm tra lại!
        </div>
      )}

      {/* Search Result */}
      {order && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Phiếu bảo hành điện tử</span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-sky-400 text-lg">#{order.orderCode}</span>
                <Badge variant={order.orderStatus === 'DA_GIAO' ? 'success' : order.orderStatus === 'DA_HUY' ? 'danger' : 'primary'}>
                  {order.orderStatus}
                </Badge>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-0.5 sm:text-right">
              <p>
                Khách hàng: <strong className="text-white">{order.customerName}</strong> ({order.phone})
              </p>
              <p className="text-slate-400">
                Ngày mua: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-800">
              <thead className="bg-slate-950/50 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">Linh kiện / Sản phẩm</th>
                  <th className="p-4 text-center">SL</th>
                  <th className="p-4 text-center">Thời hạn BH</th>
                  <th className="p-4 text-center">Ngày hết hạn</th>
                  <th className="p-4 text-right">Trạng thái bảo hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {order.items.map((item, idx) => {
                  const info = getWarrantyDetails(order, item.warrantyMonths);
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-900/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                          <span className="font-semibold text-slate-100">{item.productName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-200">{item.quantity}</td>
                      <td className="p-4 text-center font-semibold text-sky-400">{info.months} tháng</td>
                      <td className="p-4 text-center font-mono text-slate-300">{info.expiryDateStr}</td>
                      <td className="p-4 text-right">{info.badge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warranty Policy Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">1 Đổi 1 Trong 30 Ngày</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Đổi mới ngay lập tức trong 30 ngày đầu nếu linh kiện phát sinh lỗi phần cứng từ nhà sản xuất (còn nguyên tem/serial).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Bảo Hành Chính Hãng 12–36 Tháng</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            CPU, Mainboard, VGA, RAM, SSD, Nguồn đều được bảo hành điện tử theo mã đơn hàng từ 12 đến 36 tháng tùy dòng sản phẩm.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Hỗ Trợ Chẩn Đoán IoT & AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Khách hàng có node IoT được hỗ trợ kiểm tra log nhiệt độ, quá tải điện áp và phát hiện lỗi linh kiện từ xa trước khi gửi bảo hành.
          </p>
        </div>
      </div>
    </div>
  );
};
