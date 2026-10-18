import React from 'react';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  className = '',
  size = 'md',
}) => {
  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + '₫';
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
    xl: 'text-2xl font-black text-rose-400',
  };

  return (
    <div className={`flex items-baseline gap-2 flex-wrap ${className}`}>
      <span className={`${sizeClasses[size]} text-rose-500`}>
        {formatVnd(price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-slate-400 line-through">
            {formatVnd(originalPrice)}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
};
