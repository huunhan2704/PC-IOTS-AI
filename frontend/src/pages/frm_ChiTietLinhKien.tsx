import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RotateCcw,
  Star,
  Layers,
  Wrench,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { builderService } from '@/services/builderService';
import { useCartStore } from '@/store/cartStore';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export const frm_ChiTietLinhKien: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [checkProductId, setCheckProductId] = useState<number | ''>('');
  const [compatResult, setCompatResult] = useState<{ compatible: boolean; messages: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'warranty' | 'reviews'>('specs');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlugOrId(slug!),
    enabled: !!slug,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.categorySlug],
    queryFn: () =>
      productService.getProducts({ category: product?.categorySlug, size: 4 }).then((res) => res.content),
    enabled: !!product?.categorySlug,
  });

  const { data: allProductsForCheck = [] } = useQuery({
    queryKey: ['all-products-check'],
    queryFn: () => productService.getProducts({ size: 100 }).then((res) => res.content),
    enabled: !!product,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Đang tải thông số kỹ thuật sản phẩm...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-lg font-bold text-slate-300">Không tìm thấy linh kiện này</p>
        <Link to="/" className="text-xs text-sky-400 hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const currentImg = selectedImage || product.imageUrl;

  const handleQuickCheck = async () => {
    if (!checkProductId) {
      toast.warning('Vui lòng chọn linh kiện thứ hai để kiểm tra');
      return;
    }
    try {
      const res = await builderService.quickCheck(product.id, Number(checkProductId));
      setCompatResult(res);
    } catch (e: any) {
      toast.error('Không thể kiểm tra tương thích lúc này');
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/thanh-toan');
  };

  const allImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  // Parse technical specs table
  const specs = product.specs;
  const techEntries = specs?.technicalJson ? Object.entries(specs.technicalJson) : [];

  return (
    <div className="space-y-12">
      {/* 1. Gallery + Info Block */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-6 shadow-xl">
            <img
              src={currentImg}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-all duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://placehold.co/600x600/0f172a/38bdf8?text=Linh+Kien';
              }}
            />
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 shrink-0 transition ${
                    currentImg === img ? 'border-sky-500 shadow-md shadow-sky-500/20' : 'border-slate-800'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Block */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {product.brand}
              </Badge>
              <Badge variant="neutral" size="sm">
                {product.categoryName || 'Linh Kiện PC'}
              </Badge>
              {isOutOfStock ? (
                <Badge variant="danger" size="sm">
                  Hết hàng
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  Còn {product.stockQuantity} sản phẩm
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>(5.0 • 12 nhận xét đánh giá)</span>
              <span>•</span>
              <span className="font-mono text-slate-300">Bảo hành: {product.warrantyMonths} tháng</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <PriceTag price={product.price} originalPrice={product.originalPrice} size="xl" />
            <p className="text-[11px] text-slate-400 mt-1">
              Đã bao gồm VAT 10% • Hỗ trợ trả góp 0% • Miễn phí vận chuyển toàn quốc
            </p>
          </div>

          {/* Quantity Stepper & Buttons */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-300 uppercase">Số Lượng:</span>
              <div className="inline-flex items-center border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white transition"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-mono font-bold text-slate-100">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  disabled={quantity >= product.stockQuantity}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-slate-500">
                (Kho còn: {product.stockQuantity})
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Thêm Vào Giỏ Hàng
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Mua Ngay
              </Button>
            </div>
          </div>

          {/* Quick Compatibility Checker Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Tiện Ích Kiểm Tra Tương Thích Nhanh (Quick Compatibility)
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              Chọn một linh kiện khác trong cửa hàng để kiểm tra xem có lắp vừa với{' '}
              <strong className="text-slate-200">{product.name}</strong> không:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={checkProductId}
                onChange={(e) => setCheckProductId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Chọn một linh kiện cần ghép nối --</option>
                {allProductsForCheck
                  .filter((p) => p.id !== product.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.brand}] {p.name}
                    </option>
                  ))}
              </select>
              <Button size="sm" onClick={handleQuickCheck}>
                Kiểm Tra
              </Button>
            </div>

            {compatResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  compatResult.compatible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {compatResult.compatible ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {compatResult.compatible ? 'HOÀN TOÀN TƯƠNG THÍCH 100%' : 'CẢNH BÁO XUNG ĐỘT KỸ THUẬT'}
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] opacity-90">
                    {compatResult.messages.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Specs Matrix Table & Policy Tabs */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex border-b border-slate-800 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'specs'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Thông Số Kỹ Thuật Chi Tiết (Specs Matrix)
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'warranty'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chính Sách Bảo Hành & Đổi Trả
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition border-b-2 ${
              activeTab === 'reviews'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đánh Giá Từ Khách Hàng (12)
          </button>
        </div>

        {activeTab === 'specs' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left divide-y divide-slate-800/80">
              <tbody className="divide-y divide-slate-800/60">
                {specs?.socket && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400 w-1/3">Socket CPU / Mainboard</td>
                    <td className="py-2.5 font-mono text-sky-400">{specs.socket}</td>
                  </tr>
                )}
                {specs?.ramGeneration && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Chuẩn RAM hỗ trợ</td>
                    <td className="py-2.5 text-slate-200">{specs.ramGeneration}</td>
                  </tr>
                )}
                {specs?.ramBus && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Tần số Bus RAM</td>
                    <td className="py-2.5 font-mono text-slate-200">{specs.ramBus} MHz</td>
                  </tr>
                )}
                {specs?.formFactor && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Kích thước chuẩn (Form Factor)</td>
                    <td className="py-2.5 text-slate-200">{specs.formFactor}</td>
                  </tr>
                )}
                {specs?.tdp !== undefined && specs.tdp > 0 && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Công suất tiêu thụ (TDP)</td>
                    <td className="py-2.5 font-mono text-amber-400">{specs.tdp} W</td>
                  </tr>
                )}
                {specs?.psuWattage && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Công suất định danh bộ nguồn</td>
                    <td className="py-2.5 font-mono text-emerald-400">{specs.psuWattage} W</td>
                  </tr>
                )}
                {specs?.psuEfficiency && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Chứng nhận hiệu suất</td>
                    <td className="py-2.5 text-slate-200">{specs.psuEfficiency}</td>
                  </tr>
                )}
                {specs?.vram && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Dung lượng bộ nhớ đồ họa (VRAM)</td>
                    <td className="py-2.5 text-slate-200">{specs.vram} GB</td>
                  </tr>
                )}
                {specs?.gpuLengthMm && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Chiều dài card đồ họa</td>
                    <td className="py-2.5 text-slate-200">{specs.gpuLengthMm} mm</td>
                  </tr>
                )}
                {specs?.maxGpuLengthMm && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Khoảng trống VGA tối đa vỏ case</td>
                    <td className="py-2.5 text-slate-200">{specs.maxGpuLengthMm} mm</td>
                  </tr>
                )}
                {specs?.coolerTdpRating && (
                  <tr>
                    <td className="py-2.5 font-bold text-slate-400">Khả năng giải nhiệt tối đa (Cooler TDP)</td>
                    <td className="py-2.5 font-mono text-sky-400">{specs.coolerTdpRating} W</td>
                  </tr>
                )}
                {/* Dynamic Technical JSON */}
                {techEntries.map(([k, v], idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold text-slate-400">{k}</td>
                    <td className="py-2.5 text-slate-200">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'warranty' && (
          <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              • <strong>Bảo hành chính hãng:</strong> {product.warrantyMonths} tháng tại các trung tâm bảo hành ủy quyền toàn quốc.
            </p>
            <p>
              • <strong>Chính sách 1 đổi 1:</strong> Đổi mới trong vòng 30 ngày đầu tiên nếu phát sinh lỗi từ nhà sản xuất.
            </p>
            <p>
              • <strong>Hỗ trợ kỹ thuật:</strong> Kiểm tra tương thích phần cứng miễn phí, tra keo tản nhiệt và lắp đặt hoàn thiện.
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-xs">Trần Hữu Nhân</span>
                <span className="text-[10px] text-slate-500">2 ngày trước</span>
              </div>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300">
                Linh kiện chính hãng, đóng gói cẩn thận 3 lớp chống sốc, lắp vào máy nhận đủ xung và bus ngay.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            Linh Kiện Cùng Chủng Loại
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.id}
                  to={`/san-pham/${p.slug}`}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full aspect-square object-cover rounded-xl bg-slate-950 mb-2"
                  />
                  <p className="text-xs font-bold text-slate-200 line-clamp-1 hover:text-sky-400">
                    {p.name}
                  </p>
                  <PriceTag price={p.price} size="sm" />
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
