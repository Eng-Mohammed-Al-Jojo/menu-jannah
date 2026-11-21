import React, { useCallback, useMemo } from "react";
import { type Item } from "./Menu";
import { ShoppingBag, Star, ChevronLeft } from "lucide-react";
import { formatPriceSummary, getPriceOptions } from "../../utils/priceUtils";

interface Props {
  item: Item;
  orderSystem: boolean;
  onClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
  index?: number;
}

const ItemRow = React.memo(({ item, orderSystem, onClick, onDetailsClick }: Props) => {
  const priceOptions = useMemo(
    () => getPriceOptions(item),
    [item.price, item.variants]
  );
  const unavailable = item.visible === false;
  const itemName = item.nameAr || item.name || "";
  const description = item.ingredientsAr || item.ingredients || "";
  const canOrder = !unavailable && orderSystem;
  const isFeatured = item.star || (item as any).isFeatured;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (unavailable) return;
      if (orderSystem) {
        onClick?.(item);
      } else {
        onDetailsClick?.(item);
      }
    },
    [unavailable, orderSystem, item, onClick, onDetailsClick]
  );

  return (
    <div
      className={`group relative mx-3 sm:mx-0 flex items-center gap-2 sm:gap-4 px-1.5 py-2.5 sm:px-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border transition-all duration-300 transform-gpu ${unavailable
        ? "opacity-60 cursor-not-allowed border-neutral-200"
        : "cursor-pointer border-amber-500/12 hover:border-amber-500/35 hover:shadow-[0_8px_24px_rgba(11,59,45,0.10)] hover:-translate-y-0.5"
        }`}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      aria-label={itemName}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(e as any);
      }}
    >
      {/* Product Image Thumbnail */}
      <div className="relative w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] rounded-lg sm:rounded-xl overflow-visible shrink-0 bg-neutral-100 border border-amber-500/10 shadow-sm">
        <img
          className={`w-full h-full rounded-lg sm:rounded-xl object-cover block transition-transform duration-500 transform-gpu ${!unavailable ? "group-hover:scale-108" : "grayscale-[40%]"
            }`}
          src={item.image ? `/images/${item.image}` : "/jannah-logo.jpg"}
          alt={itemName}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/jannah-logo.jpg";
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

        {/* Unavailable overlay badge */}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-[2px]">
            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-neutral-900/80">
              غير متوفر
            </span>
          </div>
        )}

        {/* Star Badge */}
        {isFeatured && !unavailable && (
          <div className="absolute top-1 -right-2 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-[var(--brand-obsidian)] shadow-md border-2 border-white">
            <Star size={10} className="fill-current" />
          </div>
        )}
      </div>

      {/* Item Details Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-[14px] sm:text-lg text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {itemName}
          </h4>
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2 leading-snug font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Price & Add Button */}
      <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 gap-1">
        {/* Price Tag */}
        <div className={`relative left-2 flex items-baseline gap-2 font-black text-amber-600 ${unavailable ? "line-through opacity-50" : ""}`}>
          {item.promotionOriginalPrice && (
            <span className="text-[10px] text-neutral-400 line-through no-underline">
              {item.promotionOriginalPrice.toFixed(2)} ₪
            </span>
          )}
          <span className="text-sm sm:text-lg font-black tracking-tight" dir="ltr">{formatPriceSummary(priceOptions)}</span>
        </div>

        {unavailable && (
          <span className="text-[10px] font-bold text-red-600 whitespace-nowrap">
            لقد نفذت الكمية
          </span>
        )}

        {/* Action Button */}
        {canOrder ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(e); }}
            aria-label={`إضافة ${itemName} للطلب`}
            className="flex items-center justify-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-snouno-dark text-amber-400 font-bold text-[10px] sm:text-xs shadow-md border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ShoppingBag size={13} />
            <span className="hidden sm:inline">أضف</span>
          </button>
        ) : !unavailable ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
            <ChevronLeft size={16} />
          </div>
        ) : null}
      </div>
    </div>
  );
});

ItemRow.displayName = "ItemRow";
export default ItemRow;
