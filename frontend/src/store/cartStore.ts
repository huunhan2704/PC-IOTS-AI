import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, ProductDto, CouponResult } from '@/types';
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  coupon: CouponResult | null;
  addItem: (product: ProductDto, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: CouponResult) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getShippingFee: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

function recalculateCoupon(coupon: CouponResult | null, subtotal: number): CouponResult | null {
  if (!coupon || subtotal <= 0) return null;
  const code = coupon.code.toUpperCase().trim();

  if (code === 'NHAN10') {
    if (subtotal < 1000000) return null;
    const discountAmount = Math.min(500000, Math.round(subtotal * 0.1));
    return { ...coupon, discountAmount, freeShipping: false };
  }
  if (code === 'IOTAI200K') {
    if (subtotal < 3000000) return null;
    return { ...coupon, discountAmount: Math.min(200000, subtotal), freeShipping: false };
  }
  if (code === 'FREESHIP') {
    if (subtotal < 2000000) return null;
    return { ...coupon, discountAmount: 0, freeShipping: true };
  }

  return {
    ...coupon,
    discountAmount: Math.min(coupon.discountAmount || 0, subtotal),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.product.id === product.id);
        let nextItems: CartItem[];

        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > product.stockQuantity) {
            toast.error(`Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} trong kho!`);
            return;
          }
          nextItems = currentItems.map((i) =>
            i.product.id === product.id ? { ...i, quantity: newQty } : i
          );
        } else {
          if (quantity > product.stockQuantity) {
            toast.error(`Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} trong kho!`);
            return;
          }
          nextItems = [...currentItems, { product, quantity }];
        }

        const nextSubtotal = nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        set({
          items: nextItems,
          coupon: recalculateCoupon(get().coupon, nextSubtotal),
        });
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const nextItems = get().items.map((i) => {
          if (i.product.id === productId) {
            const clamped = Math.min(quantity, i.product.stockQuantity);
            if (clamped < quantity) {
              toast.warning(`Chỉ còn ${i.product.stockQuantity} sản phẩm trong kho`);
            }
            return { ...i, quantity: clamped };
          }
          return i;
        });
        const nextSubtotal = nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        set({
          items: nextItems,
          coupon: recalculateCoupon(get().coupon, nextSubtotal),
        });
      },
      removeItem: (productId) => {
        const nextItems = get().items.filter((i) => i.product.id !== productId);
        const nextSubtotal = nextItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        set({
          items: nextItems,
          coupon: recalculateCoupon(get().coupon, nextSubtotal),
        });
        toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
      },
      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (coupon) => {
        const sub = get().getSubtotal();
        const recalculated = recalculateCoupon(coupon, sub);
        if (!recalculated) {
          toast.error('Đơn hàng chưa đủ điều kiện áp dụng mã giảm giá này');
          return;
        }
        set({ coupon: recalculated });
        toast.success(
          recalculated.freeShipping
            ? `Áp dụng mã ${recalculated.code} thành công: Miễn phí vận chuyển`
            : `Áp dụng mã ${recalculated.code} thành công: -${new Intl.NumberFormat('vi-VN').format(recalculated.discountAmount)}đ`
        );
      },
      removeCoupon: () => set({ coupon: null }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
      getDiscountAmount: () => {
        const sub = get().getSubtotal();
        const validCoupon = recalculateCoupon(get().coupon, sub);
        return validCoupon?.discountAmount || 0;
      },
      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        const validCoupon = recalculateCoupon(get().coupon, subtotal);
        if (validCoupon?.freeShipping) return 0;
        if (subtotal >= 5000000 || subtotal === 0) return 0;
        return 40000;
      },
      getTotalAmount: () => {
        const sub = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const ship = get().getShippingFee();
        return Math.max(0, sub - discount + ship);
      },
      getItemCount: () => {
        return get().items.reduce((count, i) => count + i.quantity, 0);
      },
    }),
    {
      name: 'linhkien-cart',
    }
  )
);
