import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { cartService } from '@/services/cartService';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const frm_GioHang: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, coupon, applyCoupon, removeCoupon, getSubtotal, getDiscountAmount, getShippingFee, getTotalAmount } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const shippingFee = getShippingFee();
  const totalAmount = getTotalAmount();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplying(true);
    try {
      const res = await cartService.applyCoupon(couponCode.trim().toUpperCase(), subtotal);
      applyCoupon(res);
      setCouponCode('');
    } catch (err: any) {
      // toast is already fired by api interceptor
    } finally {
      setIsApplying(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tiến hành đặt hàng');
      navigate('/dang-nhap?redirect=/thanh-toan');
      return;
    }
    navigate('/thanh-toan');
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-slate-400">
          Chưa có linh kiện máy tính nào trong giỏ hàng. Hãy tham khảo danh mục hoặc sử dụng công cụ PC Builder để chọn cấu hình phù hợp!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục mua hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
          Giỏ Hàng Của Bạn ({items.length} sản phẩm)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Kiểm tra danh sách linh kiện và áp dụng mã ưu đãi trước khi chuyển sang bước thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {items.map(({ product, quantity }) => {
              const lineTotal = product.price * quantity;
              return (
                <div key={product.id} className="p-4 sm:p-5 flex items-center gap-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/san-pham/${product.slug}`}
                      className="text-xs sm:text-sm font-bold text-slate-100 hover:text-sky-400 line-clamp-2 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <div className="text-[11px] text-slate-400">
                      Đơn giá: <span className="font-semibold text-slate-200">{formatVnd(product.price)}</span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="inline-flex items-center border border-slate-800 rounded-lg bg-slate-950">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white transition"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-mono font-bold text-slate-200">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stockQuantity}
                          className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-extrabold text-rose-400 font-mono">
                      {formatVnd(lineTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              to="/"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Tiếp tục chọn thêm linh kiện
            </Link>
            <button
              onClick={clearCart}
              className="text-xs text-slate-500 hover:text-rose-400 transition"
            >
              Xóa sạch giỏ hàng
            </button>
          </div>
        </div>

        {/* Right: Coupon & Order Summary */}
        <div className="space-y-6">
          {/* Coupon Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Mã Giảm Giá / Khuyến Mãi
              </h4>
            </div>

            {coupon ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-emerald-400">{coupon.code}</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">{coupon.description}</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-slate-400 hover:text-rose-400 text-xs transition"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã: NHAN10, IOTAI200K..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase font-mono"
                />
                <Button size="sm" type="submit" isLoading={isApplying}>
                  Áp Dụng
                </Button>
              </form>
            )}

            <div className="text-[11px] text-slate-500 space-y-1">
              <p>• <strong>NHAN10:</strong> Giảm 10% tối đa 500k</p>
              <p>• <strong>IOTAI200K:</strong> Giảm thẳng 200k cho đơn từ 3 triệu</p>
              <p>• <strong>FREESHIP:</strong> Miễn phí vận chuyển toàn quốc</p>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Tạm tính linh kiện:</span>
                <span className="font-mono font-semibold text-slate-100">{formatVnd(subtotal)}</span>
              </div>

              {coupon && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Giảm giá ({coupon.code}):</span>
                  <span className="font-mono">-{formatVnd(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-mono font-semibold text-slate-100">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-400">Miễn phí</span>
                  ) : (
                    formatVnd(shippingFee)
                  )}
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
              variant="primary"
              size="lg"
              onClick={handleProceedToCheckout}
              className="w-full mt-4"
            >
              Tiến Hành Đặt Hàng
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
