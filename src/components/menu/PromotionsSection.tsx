import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiChevronLeft, FiChevronRight, FiX, FiInfo } from 'react-icons/fi';
import { PromotionService } from '../../services/promotionService';
import {
  type Promotion,
  isPromotionVisible,
  getDiscountPercentage,
  getDaysRemaining,
} from '../../types/promotion';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

/* ═══════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════ */
function CountdownBadge({ days }: { days: number }) {
  if (days === 0) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
        <FiClock size={10} className="animate-pulse" />
        ينتهي اليوم!
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
      <FiClock size={10} />
      {days} {days === 1 ? 'يوم' : 'أيام'} متبقية
    </span>
  );
}

/* ═══════════════════════════════════════
   PROMOTION CARD
   ═══════════════════════════════════════ */
function PromotionCard({ promotion, item, onClick }: { promotion: Promotion; item: any; onClick: () => void }) {
  const daysLeft = getDaysRemaining(promotion);
  const discountPct = getDiscountPercentage(promotion.originalPrice, promotion.finalPrice);
  const imageUrl = promotion.image || (item?.image ? (item.image.startsWith('/') ? item.image : `/images/${item.image}`) : null);
  const variantPrices = item?.variants?.map((variant: any, index: number) => Number(promotion.variantPrices?.[variant.id || `legacy-${index}`])).filter((price: number) => Number.isFinite(price) && price >= 0) || [];
  const variantDiscounts = item?.variants?.map((variant: any, index: number) => {
    const offer = Number(promotion.variantPrices?.[variant.id || `legacy-${index}`]);
    const original = Number(variant.price);
    return Number.isFinite(offer) && original > 0 ? Math.round(((original - offer) / original) * 100) : null;
  }).filter((value: number | null): value is number => value !== null) || [];
  const discountLabel = variantDiscounts.length > 0
    ? (Math.min(...variantDiscounts) === Math.max(...variantDiscounts) ? `-${variantDiscounts[0]}%` : `-${Math.min(...variantDiscounts)}–${Math.max(...variantDiscounts)}%`)
    : `-${discountPct}%`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative flex flex-col text-right bg-white rounded-2xl overflow-hidden border border-amber-500/15 shadow-sm hover:shadow-md transition-shadow shrink-0 w-52 sm:w-60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
    >
      {/* Discount Badge */}
      <div className="absolute top-2.5 right-2.5 z-10 bg-amber-500 text-snouno-dark text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
        {discountLabel}
      </div>

      {/* Image */}
      <div className="w-full h-36 sm:h-40 bg-neutral-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item?.nameAr || promotion.title}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.src = '/logo.png'; }}
          />
        ) : (
          <img
            src="/jannah-logo.jpg"
            alt="شعار مطعم جنة"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* Item Name */}
        <h4 className="font-black text-neutral-900 text-sm leading-tight truncate">
          {item?.nameAr || item?.name || promotion.title}
        </h4>

        {/* Promotion Title */}
        {promotion.title && promotion.title !== (item?.nameAr || item?.name) && (
          <p className="text-[10px] text-amber-600 font-bold truncate">{promotion.title}</p>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-xl font-black text-amber-600">
            {variantPrices.length > 0 ? `من ${Math.min(...variantPrices).toFixed(2)} ₪` : `${promotion.finalPrice.toFixed(2)} ₪`}
          </span>
          {variantPrices.length === 0 && (
            <span className="text-xs text-neutral-400 line-through font-medium">
              {promotion.originalPrice.toFixed(2)} ₪
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600"><FiInfo size={11} /> اضغط لمعرفة التفاصيل</span>

        {/* Countdown */}
        {daysLeft !== null && <CountdownBadge days={daysLeft} />}
      </div>
    </motion.button>
  );
}

function PromotionDetails({ promotion, item, onClose }: { promotion: Promotion; item: any; onClose: () => void }) {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  const imageUrl = promotion.image || (item?.image ? (item.image.startsWith('/') ? item.image : `/images/${item.image}`) : '/jannah-logo.jpg');
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="تفاصيل العرض">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="إغلاق" />
      <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-amber-500/20" dir="rtl">
        <button type="button" onClick={onClose} className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65" aria-label="إغلاق"><FiX size={18} /></button>
        <img src={imageUrl} alt={item?.nameAr || promotion.title} className="h-48 w-full object-cover" onError={e => { e.currentTarget.src = '/jannah-logo.jpg'; }} />
        <div className="space-y-4 p-5">
          <div><h3 className="text-xl font-black text-neutral-900">{promotion.title || item?.nameAr}</h3><p className="mt-1 text-sm font-bold text-neutral-500">{item?.nameAr}</p>{promotion.description && <p className="mt-2 text-xs leading-relaxed text-neutral-500">{promotion.description}</p>}</div>
          {variants.length > 0 && promotion.variantPrices ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-3">
              <p className="mb-2 text-xs font-black text-amber-700">أسعار العرض حسب الخيار</p>
              <div className="space-y-2">{variants.map((variant: any, index: number) => {
                const original = Number(variant.price);
                const offer = Number(promotion.variantPrices?.[variant.id || `legacy-${index}`]);
                if (!Number.isFinite(offer)) return null;
                const pct = original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
                return <div key={variant.id || index} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-xs"><span className="min-w-0 truncate font-bold text-neutral-800">{variant.name}</span><span className="flex shrink-0 items-center gap-2" dir="ltr"><span className="text-neutral-400 line-through">{original.toFixed(2)} ₪</span><span className="font-black text-emerald-600">{offer.toFixed(2)} ₪</span>{pct > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700">-{pct}%</span>}</span></div>;
              })}</div>
            </div>
          ) : <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-50/50 px-4 py-3"><span className="text-sm font-bold text-neutral-500">السعر</span><span className="flex items-center gap-2" dir="ltr"><span className="text-xs text-neutral-400 line-through">{promotion.originalPrice.toFixed(2)} ₪</span><span className="text-xl font-black text-emerald-600">{promotion.finalPrice.toFixed(2)} ₪</span></span></div>}
          <button type="button" onClick={onClose} className="w-full rounded-2xl bg-snouno-dark py-3 text-sm font-black text-amber-300">إغلاق التفاصيل</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PROMOTIONS SECTION
   ═══════════════════════════════════════ */
interface PromotionsSectionProps {
  onVisibilityChange?: (visible: boolean) => void;
  onReady?: () => void;
}

export default function PromotionsSection({ onVisibilityChange, onReady }: PromotionsSectionProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [items, setItems] = useState<Record<string, any>>({});
  const [scrollIdx, setScrollIdx] = useState(0);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promotionsError, setPromotionsError] = useState(false);

  // Firebase listeners
  useEffect(() => {
    let promotionsLoaded = false;
    let itemsLoaded = false;
    let readyNotified = false;

    const notifyReady = () => {
      if (!readyNotified && promotionsLoaded && itemsLoaded) {
        readyNotified = true;
        onReady?.();
      }
    };

    const unsubPromotions = PromotionService.subscribe((nextPromotions) => {
      setPromotions(nextPromotions);
      setPromotionsError(false);
      promotionsLoaded = true;
      notifyReady();
    }, () => {
      setPromotionsError(true);
      promotionsLoaded = true;
      notifyReady();
    });
    const unsubItems = onValue(ref(db, 'items'), snap => {
      setItems(snap.val() || {});
      itemsLoaded = true;
      notifyReady();
    });
    return () => {
      unsubPromotions();
      unsubItems();
    };
  }, [onReady]);

  // فقط العروض الفعالة حاليًا
  const activePromotions = useMemo(
    () => promotions.filter(isPromotionVisible),
    [promotions]
  );

  // إعلام الـ parent بوجود/غياب عروض
  useEffect(() => {
    onVisibilityChange?.(activePromotions.length > 0);
  }, [activePromotions.length, onVisibilityChange]);

  useEffect(() => {
    if (activePromotions.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const maxIndex = Math.max(0, activePromotions.length - 3);
    const timer = window.setInterval(() => {
      setScrollIdx((current) => current >= maxIndex ? 0 : current + 1);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activePromotions.length]);

  if (promotionsError || activePromotions.length === 0) return null;

  const VISIBLE = 3;
  const canScrollLeft = scrollIdx > 0;
  const canScrollRight = scrollIdx + VISIBLE < activePromotions.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mb-10"
      aria-label="عروضنا المميزة"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          {/* Animated dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <h2 className="text-lg font-black text-neutral-900">عروضنا المميزة</h2>
        </div>

        {/* Navigation arrows (only when overflow) */}
        {activePromotions.length > VISIBLE && (
          <div className="flex gap-1.5">
            <button
              onClick={() => setScrollIdx(i => Math.max(0, i - 1))}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-amber-500/20 bg-white text-neutral-600 flex items-center justify-center hover:bg-amber-50 hover:border-amber-400 disabled:opacity-30 transition-all"
              aria-label="السابق"
            >
              <FiChevronRight size={15} />
            </button>
            <button
              onClick={() => setScrollIdx(i => Math.min(activePromotions.length - VISIBLE, i + 1))}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-amber-500/20 bg-white text-neutral-600 flex items-center justify-center hover:bg-amber-50 hover:border-amber-400 disabled:opacity-30 transition-all"
              aria-label="التالي"
            >
              <FiChevronLeft size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Cards — horizontal scroll on mobile, controlled carousel on desktop */}
      <div className="relative overflow-hidden">
        {/* Mobile: native scroll */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:hidden">
          {activePromotions.map(p => (
            <PromotionCard
              key={p.id}
              promotion={p}
              item={items[p.itemId]}
              onClick={() => setSelectedPromotion(p)}
            />
          ))}
        </div>

        {/* Desktop: controlled scroll */}
        <div className="hidden md:flex gap-3 overflow-hidden min-h-[275px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {activePromotions.slice(scrollIdx, scrollIdx + VISIBLE).map(p => (
              <PromotionCard
                key={p.id}
                promotion={p}
                item={items[p.itemId]}
                onClick={() => setSelectedPromotion(p)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Dots indicator */}
      {activePromotions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: Math.max(1, activePromotions.length - VISIBLE + 1) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setScrollIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === scrollIdx ? 'w-6 bg-amber-500' : 'w-1.5 bg-neutral-200 hover:bg-amber-300'}`}
              aria-label={`الانتقال للعرض ${i + 1}`}
            />
          ))}
        </div>
      )}
      {selectedPromotion && <PromotionDetails promotion={selectedPromotion} item={items[selectedPromotion.itemId]} onClose={() => setSelectedPromotion(null)} />}
    </motion.section>
  );
}
