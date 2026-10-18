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
  getShippingFee: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.product.id === product.id);

        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > product.stockQuantity) {
            toast.error(`Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} trong kho!`);
            return;
          }
          set({
            items: currentItems.map((i) =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          if (quantity > product.stockQuantity) {
            toast.error(`Sản phẩm ${product.name} chỉ còn ${product.stockQuantity} trong kho!`);
            return;
          }
          set({ items: [...currentItems, { product, quantity }] });
        }
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.product.id === productId) {
              const clamped = Math.min(quantity, i.product.stockQuantity);
              if (clamped < quantity) {
                toast.warning(`Chỉ còn ${i.product.stockQuantity} sản phẩm trong kho`);
              }
              return { ...i, quantity: clamped };
            }
            return i;
          }),
        });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
        toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
      },
      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (coupon) => {
        set({ coupon });
        toast.success(`Áp dụng mã ${coupon.code} thành công: -${new Intl.NumberFormat('vi-VN').format(coupon.discountAmount)}đ`);
      },
      removeCoupon: () => set({ coupon: null }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },
      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().coupon;
        if (coupon?.freeShipping) return 0;
        if (subtotal >= 5000000 || subtotal === 0) return 0;
        return 40000;
      },
      getTotalAmount: () => {
        const sub = get().getSubtotal();
        const discount = get().coupon?.discountAmount || 0;
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
