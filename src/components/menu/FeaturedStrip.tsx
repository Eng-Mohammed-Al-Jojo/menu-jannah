import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import type { Item } from "./Menu";
import { formatPriceSummary, getPriceOptions } from "../../utils/priceUtils";

interface Props {
  items: Item[];
  orderSystem: boolean;
  onItemClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
  onViewAll?: () => void;
}

export default function FeaturedStrip({ items, orderSystem, onItemClick, onDetailsClick, onViewAll }: Props) {
  if (!items.length) return null;

  return (
    <section className="mb-8" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between gap-4 mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-1">
            <Star size={14} className="fill-amber-500 text-amber-500" /> توصية جنة
          </div>
          <h2 id="featured-heading" className="text-2xl font-black text-snouno-dark">الأصناف المميزة</h2>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm font-bold text-amber-700 hover:text-snouno-dark transition-colors">
            عرض الكل
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 px-1">
        {items.slice(0, 6).map((item, index) => {
          const name = item.nameAr || item.name;
          const priceOptions = getPriceOptions(item);
          const unavailable = item.visible === false;
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !unavailable && (orderSystem ? onItemClick?.(item) : onDetailsClick?.(item))}
              className={`relative snap-start shrink-0 w-[78vw] sm:w-[280px] h-64 sm:h-72 overflow-hidden rounded-[24px] bg-snouno-dark text-white shadow-none ${unavailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={item.image ? (item.image.startsWith("/") || item.image.startsWith("http") ? item.image : `/images/${item.image}`) : "/jannah-logo.jpg"}
                  alt={name}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.src = "/jannah-logo.jpg"; }}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-snouno-dark via-snouno-dark/35 to-transparent" />
              </div>
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-snouno-dark"><Star size={11} className="fill-current" /> مميز</span>
              <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                <h3 className="font-bold truncate">{name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-black text-amber-300">{formatPriceSummary(priceOptions)}</span>
                  {orderSystem && !unavailable && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-snouno-dark"><ShoppingBag size={15} /></span>}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
