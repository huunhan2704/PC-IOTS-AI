import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ProductDto } from '@/types';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: ProductDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleAddToCart = () => {
    if (!isAuthenticated()) {
      toast.warning('Vui lòng đăng nhập tài khoản trước khi mua hàng!');
      navigate('/dang-nhap');
      return;
    }
    addItem(product, 1);
  };

  // Derive key spec chips
  const chips: string[] = [];
  if (product.specs) {
    const s = product.specs;
    if (s.cores && s.threads) chips.push(`${s.cores}N/${s.threads}L`);
    if (s.socket) chips.push(s.socket);
    if (s.ramGeneration) chips.push(s.ramGeneration);
    if (s.capacityGb) chips.push(`${s.capacityGb}GB`);
    if (s.vram) chips.push(`${s.vram}GB VRAM`);
    if (s.psuWattage) chips.push(`${s.psuWattage}W`);
    if (s.coolerTdpRating) chips.push(`TDP ${s.coolerTdpRating}W`);
    else if (s.tdp) chips.push(`TDP ${s.tdp}W`);
    if (s.formFactor) chips.push(s.formFactor);
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <div className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-sky-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5">
      {/* Product Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800/60 mb-3.5">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://placehold.co/600x600/0f172a/38bdf8?text=Linh+Kien';
          }}
        />

        {/* Brand Badge */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-sky-400 border border-slate-700/80 backdrop-blur-md">
          {product.brand}
        </span>

        {/* Stock Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <Badge variant="danger" size="sm">
              <XCircle className="w-3 h-3" /> Hết hàng
            </Badge>
          ) : isLowStock ? (
            <Badge variant="warning" size="sm">
              <AlertTriangle className="w-3 h-3" /> Còn {product.stockQuantity}
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" /> Còn hàng
            </Badge>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="space-y-2">
        <Link to={`/san-pham/${product.slug}`}>
          <h3 className="text-sm font-bold text-slate-100 hover:text-sky-400 line-clamp-2 transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>

        {/* Core Specs Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 min-h-[22px]">
            {chips.slice(0, 3).map((chip, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Price Section */}
        <PriceTag price={product.price} originalPrice={product.originalPrice} size="md" />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
        <Link
          to={`/san-pham/${product.slug}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          Chi tiết
        </Link>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-950 font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm shadow-sky-500/20 active:scale-95"
          title="Thêm nhanh vào giỏ hàng"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
