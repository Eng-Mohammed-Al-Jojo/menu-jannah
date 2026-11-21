import React, { useCallback, useMemo } from "react";
import { type Item } from "./Menu";
import { ShoppingBag, Star } from "lucide-react";
import { formatPriceSummary, getPriceOptions } from "../../utils/priceUtils";

interface Props {
  item: Item;
  orderSystem: boolean;
  onClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
}

const ItemCard = React.memo(({ item, orderSystem, onClick, onDetailsClick }: Props) => {
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
    <article
      className={`group relative flex flex-col rounded-2xl overflow-hidden h-full border transition-all duration-300 transform-gpu bg-white ${unavailable
          ? "opacity-60 cursor-not-allowed border-neutral-200/80"
          : "cursor-pointer border-amber-500/10 hover:border-amber-500/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,158,11,0.10)]"
        }`}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      aria-label={itemName}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(e as any);
      }}
    >
      {/* Product Image */}
      <div className="relative w-full overflow-hidden shrink-0 aspect-[4/3] bg-neutral-100">
        <img
          className={`w-full h-full object-cover block transition-transform duration-500 transform-gpu will-change-transform ${!unavailable ? "group-hover:scale-105" : "grayscale-[40%]"
            }`}
          src={item.image ? `/images/${item.image}` : "/logo.png"}
          alt={itemName}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/logo.png";
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Unavailable overlay */}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <span className="font-bold text-xs text-white px-3 py-1 rounded-full bg-neutral-800/80 border border-white/15">
              غير متوفر
            </span>
          </div>
        )}

        {/* Star Badge */}
        {isFeatured && !unavailable && (
          <div className="absolute top-2.5 start-2.5 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white shadow-md">
            <Star size={12} className="fill-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        <h3 className="font-bold text-sm text-neutral-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
          {itemName}
        </h3>

        {description && (
          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-1 flex-1">
            {description}
          </p>
        )}
        {!description && <div className="flex-1" />}

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/08 mt-0.5">
          <div className={`flex flex-wrap items-baseline gap-1 font-black text-amber-600 ${unavailable ? "line-through opacity-50" : ""}`}>
            {item.promotionOriginalPrice && (
              <span className="text-[11px] text-neutral-400 line-through no-underline">
                {item.promotionOriginalPrice.toFixed(2)} ₪
              </span>
            )}
            <div className="flex items-baseline gap-1 text-base leading-none font-extrabold" dir="ltr">
              {formatPriceSummary(priceOptions)}
            </div>
            {unavailable && (
              <span className="basis-full text-[10px] font-bold text-red-600 leading-4 no-underline">
                لقد نفذت الكمية
              </span>
            )}
          </div>

          {canOrder ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleClick(e); }}
              aria-label={`إضافة ${itemName} للطلب`}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-snouno-dark text-amber-400 border border-amber-500/25 transition-all duration-200 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 active:scale-95"
            >
              <ShoppingBag size={14} />
            </button>
          ) : unavailable ? (
            <span className="text-[10px] font-semibold text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-100">
              نفذ
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
});

ItemCard.displayName = "ItemCard";
export default ItemCard;
