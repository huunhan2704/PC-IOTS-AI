import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Clock,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { orderService } from '@/services/orderService';
import { CreateOrderRequest, OrderDto, PaymentMethod } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const frm_ThanhToan: React.FC = () => {
  const navigate = useNavigate();
  const { items, coupon, getSubtotal, getShippingFee, getTotalAmount, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER_QR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null);

  const subtotal = getSubtotal();
  const shippingFee = getShippingFee();
  const totalAmount = getTotalAmount();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !shippingAddress.trim() || !city.trim()) {
      toast.warning('Vui lòng điền đầy đủ thông tin giao hàng bắt buộc');
      return;
    }

    if (items.length === 0) {
      toast.error('Giỏ hàng rỗng, không thể tạo đơn');
      return;
    }

    const payload: CreateOrderRequest = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      shippingAddress: shippingAddress.trim(),
      city: city.trim(),
      note: note.trim() || undefined,
      paymentMethod,
      couponCode: coupon?.code,
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder(payload);
      setCreatedOrder(order);
      clearCart();
      toast.success('Đặt hàng thành công! Mã đơn: ' + order.orderCode);
    } catch (err: any) {
      // 409 or business error handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  // SUCCESS SCREEN
  if (createdOrder) {
    const pay = createdOrder.payment;
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
            Đặt Hàng Thành Công!
          </h1>
          <p className="text-xs text-slate-400">
            Cảm ơn bạn đã mua sắm tại LinhKiện IoT·AI. Đơn hàng của bạn đang được hệ thống xử lý.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-sky-400">{createdOrder.orderCode}</span>
            <button
              onClick={() => handleCopy(createdOrder.orderCode, 'Mã đơn hàng')}
              className="p-1 hover:text-white text-slate-400"
              title="Sao chép mã"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {createdOrder.note && createdOrder.note.includes('[TẶNG KÈM ESP32 ĐÃ KÍCH HOẠT]') && (
            <div className="max-w-lg mx-auto mt-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-1.5">
              <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                🎁 Đã Cấp & Kích Hoạt Sẵn Module IoT ESP32 Theo Bộ PC!
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">
                {createdOrder.note}
              </p>
              <p className="text-[11px] text-slate-400">
                Khi nhận máy, bạn chỉ cần mở phần mềm Desktop & đăng nhập bằng tài khoản Shop để hệ thống tự động giám sát và kích hoạt Trợ lý AI!
              </p>
            </div>
          )}
        </div>

        {/* VietQR Bank Transfer Box if applicable */}
        {createdOrder.paymentMethod === 'BANK_TRANSFER_QR' && pay && (
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-sky-500/10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-100">
                  Thanh Toán Chuyển Khoản Qua VietQR Napas 247 (BR15)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển khoản tự động chính xác 100%
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Napas 247
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-md">
                {pay.qrPayload ? (
                  <QRCodeSVG value={pay.qrPayload} size={200} level="M" />
                ) : (
                  <img src={pay.qrImageUrl} alt="VietQR" className="w-48 h-48 object-contain" />
                )}
                <span className="text-[11px] font-bold text-slate-900 mt-2 font-mono">
                  {pay.bankName} - {pay.accountNo}
                </span>
              </div>

              {/* Transfer Details */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Ngân hàng thụ hưởng:</span>
                  <p className="font-bold text-slate-200">{pay.bankName} ({pay.bankId})</p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Số tài khoản:</span>
                  <div className="flex justify-between items-center">
                    <p className="font-mono font-bold text-sky-400 text-sm">{pay.accountNo}</p>
                    <button
                      onClick={() => handleCopy(pay.accountNo, 'Số tài khoản')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Chủ tài khoản:</span>
                  <p className="font-bold text-slate-200 uppercase">{pay.accountName}</p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Số tiền thanh toán:</span>
                  <p className="font-mono font-black text-rose-400 text-base">
                    {formatVnd(createdOrder.finalAmount)}
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Nội dung chuyển khoản (bắt buộc):</span>
                  <div className="flex justify-between items-center">
                    <p className="font-mono font-bold text-amber-400">{pay.content}</p>
                    <button
                      onClick={() => handleCopy(pay.content, 'Nội dung chuyển khoản')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Link
            to="/don-hang"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Xem lịch sử đơn hàng
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
          >
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
    );
  }

  // ORDER CHECKOUT FORM
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          Thanh Toán Đơn Hàng
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Điền thông tin người nhận và lựa chọn phương thức thanh toán an toàn.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Shipping & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Info Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
              1. Thông Tin Nhận Hàng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Họ và tên người nhận *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ví dụ: Trần Hữu Nhân"
                required
              />
              <Input
                label="Số điện thoại *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Địa chỉ giao hàng chi tiết (Số nhà, đường, phường) *"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Ví dụ: 236 Lê Văn Sỹ, Phường 1, Q. Tân Bình"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tỉnh / Thành phố *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                </select>
              </div>
            </div>

            <div>
              <Input
                label="Ghi chú giao hàng (Tùy chọn)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
              />
            </div>
          </div>

          {/* Payment Method Selection Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
              2. Phương Thức Thanh Toán
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* VietQR Option */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition ${
                  paymentMethod === 'BANK_TRANSFER_QR'
                    ? 'bg-sky-500/10 border-sky-500 text-slate-100 shadow-md shadow-sky-500/5'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'BANK_TRANSFER_QR'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER_QR')}
                  className="mt-1 accent-sky-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                    <CreditCard className="w-4 h-4" />
                    Chuyển Khoản VietQR Napas 247
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Tự động tạo mã QR động ngân hàng chuẩn EMVCo chứa chính xác số tiền và mã đơn hàng.
                  </p>
                </div>
              </label>

              {/* COD Option */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'bg-sky-500/10 border-sky-500 text-slate-100 shadow-md shadow-sky-500/5'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-sky-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                    <Banknote className="w-4 h-4" />
                    Thanh Toán Khi Nhận Hàng (COD)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Thanh toán tiền mặt cho nhân viên giao hàng sau khi kiểm tra đầy đủ linh kiện.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
              Xem Lại Đơn Hàng ({items.length} món)
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2.5 divide-y divide-slate-800/60 pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-200 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatVnd(product.price)} × {quantity}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-100 shrink-0">
                    {formatVnd(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-mono">{formatVnd(subtotal)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Giảm giá ({coupon.code}):</span>
                  <span className="font-mono">-{formatVnd(coupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-mono">
                  {shippingFee === 0 ? <span className="text-emerald-400">Miễn phí</span> : formatVnd(shippingFee)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-100">Tổng thanh toán:</span>
                <span className="text-xl font-black text-rose-400 font-mono">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-4"
            >
              Xác Nhận Đặt Hàng
            </Button>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Thao tác đặt hàng được bảo vệ bằng giao dịch an toàn @Transactional & khóa chống bán âm kho.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
