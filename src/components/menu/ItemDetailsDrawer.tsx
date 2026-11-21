import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Check, Sparkles } from "lucide-react";
import type { Item } from "./Menu";
import { getIngredientList } from "../../utils/stringUtils";
import { useCart } from "../../context/CartContext";
import { toast } from "react-hot-toast";
import { formatPriceSummary, getPriceOptions } from "../../utils/priceUtils";

interface Props {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  orderSystem?: boolean;
}

export default function ItemDetailsDrawer({ item, isOpen, onClose, orderSystem = false }: Props) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!item) return null;

  const itemName = item.nameAr || item.name || "";
  const itemDescription = item.ingredientsAr || item.ingredients || "";
  const itemNotes = (item as any).notesAr || (item as any).notes || "";
  const unavailable = item.visible === false;
  const canOrder = !unavailable && orderSystem;
  const priceOptions = getPriceOptions(item);

  const handleAddToOrder = () => {
    if (!canOrder || isAdding) return;
    setIsAdding(true);

    const numericPrice = priceOptions[0]?.price ?? 0;

    addItem(item, numericPrice);

    toast.success(`${itemName} تمت الإضافة للسلّة`, {
      icon: "🛒",
      position: "bottom-center",
      style: {
        borderRadius: "999px",
        background: "#121316",
        color: "#F59E0B",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        fontWeight: "bold",
        fontSize: "14px",
      },
    });

    setTimeout(() => {
      onClose();
      setIsAdding(false);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Bottom Sheet Drawer Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex flex-col w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] shadow-[0_24px_64px_rgba(0,0,0,0.3)] border border-amber-500/20 z-10"
            dir="rtl"
          >
            {/* Mobile Drag Indicator */}
            <div className="sm:hidden flex justify-center py-2 bg-neutral-900/5">
              <div className="w-12 h-1.5 rounded-full bg-neutral-300" />
            </div>

            {/* Header Image */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-neutral-900 overflow-hidden shrink-0">
              <img
                src={item.image ? (item.image.startsWith("/") || item.image.startsWith("http") ? item.image : `/images/${item.image}`) : "/jannah-logo.jpg"}
                alt={itemName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/jannah-logo.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 end-4 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-snouno-amber hover:text-black transition-colors"
              >
                <X size={18} />
              </button>

              {/* Title & Badge Over Image */}
              <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between text-white">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {itemName}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 text-start">
              {/* Ingredients List */}
              {getIngredientList(itemDescription).length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 block">
                    المكونات الرئيسية
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {getIngredientList(itemDescription).map((ingredient, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-neutral-800 text-xs font-semibold"
                      >
                        <Sparkles size={12} className="text-amber-500" />
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {itemNotes && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 border-s-4 border-amber-500">
                  <span className="text-xs font-bold text-amber-700 block mb-1">
                    ملاحظات الشيف
                  </span>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    {itemNotes}
                  </p>
                </div>
              )}

              {/* Price & Availability */}
              <div className="flex items-center justify-between pt-4 border-t border-amber-500/10">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 block">
                    السعر
                  </span>
                  <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1" dir="ltr">
                    {formatPriceSummary(priceOptions)}
                  </div>
                </div>

                {priceOptions.length > 1 && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                        {priceOptions.map((option) => (
                          <span key={`${option.label}-${option.price}`} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            <span>{option.label}:</span><span className="flex items-center gap-1.5" dir="ltr">{option.originalPrice && <span className="text-neutral-400 line-through">{option.originalPrice.toFixed(2)} ₪</span>}<span className="font-black text-emerald-700">{option.price.toFixed(2)} ₪</span></span>
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  {unavailable ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                      نفذت الكمية
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <Check size={12} />
                      متوفر
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            {canOrder && (
              <div className="p-4 bg-neutral-50 border-t border-neutral-200">
                <button
                  onClick={handleAddToOrder}
                  disabled={isAdding}
                  className="w-full h-13 rounded-full bg-snouno-dark text-amber-400 font-extrabold text-base flex items-center justify-center gap-2 border border-amber-500/40 shadow-lg hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 active:scale-98 cursor-pointer"
                >
                  <ShoppingBag size={20} />
                  <span>
                    {isAdding ? "جاري الإضافة..." : "إضافة إلى الطلب"}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
