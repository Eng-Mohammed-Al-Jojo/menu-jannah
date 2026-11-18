import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight,
  FiSearch, FiTag, FiCalendar, FiPercent, FiDollarSign,
  FiImage, FiClock, FiX, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import AdminLayout from '../components/admin/AdminLayout';
import FeaturedGallery from '../components/admin/FeaturedGallery';
import { PromotionService } from '../services/promotionService';
import {
  type Promotion,
  type DiscountType,
  type PromotionStatus,
  type PriceKey,
  getPromotionStatus,
  calculateFinalPrice,
  getDaysRemaining,
} from '../types/promotion';

/* ═══════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════ */
function StatusBadge({ status }: { status: PromotionStatus }) {
  const map: Record<PromotionStatus, { label: string; className: string }> = {
    active: { label: 'نشط', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    scheduled: { label: 'مجدول', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    expired: { label: 'منتهي', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
    inactive: { label: 'متوقف', className: 'bg-red-50 text-red-500 border-red-100' },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${className}`}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════
   TOAST HELPER
   ═══════════════════════════════════════ */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 30, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3.5 rounded-full shadow-xl font-bold text-sm border ${type === 'success'
          ? 'bg-snouno-dark text-amber-400 border-amber-500/25'
          : 'bg-red-600 text-white border-red-500/40'
        }`}
    >
      {message}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PROMOTION FORM
   ═══════════════════════════════════════ */
interface FormState {
  itemId: string;
  priceKey: PriceKey;
  originalPrice: string;
  discountType: DiscountType;
  discountValue: string;
  finalPrice: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  durationDays: string;
  isActive: boolean;
  order: string;
}

const EMPTY_FORM: FormState = {
  itemId: '',
  priceKey: 'price',
  originalPrice: '',
  discountType: 'percentage',
  discountValue: '',
  finalPrice: '',
  title: '',
  description: '',
  image: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  durationDays: '',
  isActive: true,
  order: '0',
};

interface PromotionFormProps {
  items: Record<string, any>;
  editingPromotion: Promotion | null;
  onSave: (data: Omit<Promotion, 'id'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function PromotionForm({ items, editingPromotion, onSave, onCancel, saving }: PromotionFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showGallery, setShowGallery] = useState(false);

  // تهيئة الفورم عند التعديل
  useEffect(() => {
    if (editingPromotion) {
      setForm({
        itemId: editingPromotion.itemId,
        priceKey: editingPromotion.priceKey,
        originalPrice: String(editingPromotion.originalPrice),
        discountType: editingPromotion.discountType,
        discountValue: String(editingPromotion.discountValue),
        finalPrice: String(editingPromotion.finalPrice),
        title: editingPromotion.title,
        description: editingPromotion.description || '',
        image: editingPromotion.image || '',
        startDate: editingPromotion.startDate,
        endDate: editingPromotion.endDate,
        durationDays: '',
        isActive: editingPromotion.isActive,
        order: String(editingPromotion.order),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingPromotion]);

  // الصنف المختار
  const selectedItem = items[form.itemId];

  // الأسعار المتاحة للصنف
  const availablePrices = useMemo(() => {
    if (!selectedItem) return [];
    const prices: { key: PriceKey; label: string; value: number }[] = [];

    if (selectedItem.price) {
      const priceStr = String(selectedItem.price);
      const firstPrice = parseFloat(priceStr.split(',')[0].trim());
      if (!isNaN(firstPrice) && firstPrice > 0) {
        prices.push({ key: 'price', label: `السعر الأساسي — ${firstPrice} ₪`, value: firstPrice });
      }
    }
    if (selectedItem.priceTw) {
      const tw = parseFloat(String(selectedItem.priceTw));
      if (!isNaN(tw) && tw > 0) {
        prices.push({ key: 'priceTw', label: `سعر التوصيل — ${tw} ₪`, value: tw });
      }
    }
    return prices;
  }, [selectedItem]);

  // تحديث السعر الأصلي عند تغيير الصنف أو السعر
  useEffect(() => {
    if (!selectedItem || availablePrices.length === 0) return;
    const chosen = availablePrices.find(p => p.key === form.priceKey) || availablePrices[0];
    setForm(f => ({ ...f, priceKey: chosen.key, originalPrice: String(chosen.value) }));
  }, [form.itemId, availablePrices]);

  // حساب السعر بعد الخصم تلقائياً
  useEffect(() => {
    const orig = parseFloat(form.originalPrice);
    const disc = parseFloat(form.discountValue);
    if (!isNaN(orig) && !isNaN(disc) && orig > 0 && disc > 0) {
      const final = calculateFinalPrice(orig, form.discountType, disc);
      setForm(f => ({ ...f, finalPrice: final.toFixed(2) }));
    } else {
      setForm(f => ({ ...f, finalPrice: '' }));
    }
  }, [form.originalPrice, form.discountType, form.discountValue]);

  // حساب تاريخ النهاية من عدد الأيام
  const handleDurationChange = (days: string) => {
    setForm(f => ({ ...f, durationDays: days }));
    const d = parseInt(days);
    if (!isNaN(d) && d > 0 && form.startDate) {
      const end = new Date(form.startDate);
      end.setDate(end.getDate() + d);
      setForm(f => ({ ...f, durationDays: days, endDate: end.toISOString().split('T')[0] }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.itemId) errs.itemId = 'يرجى اختيار الصنف';
    if (!form.title.trim()) errs.title = 'يرجى إدخال عنوان العرض';
    if (!form.originalPrice || parseFloat(form.originalPrice) <= 0) errs.originalPrice = 'السعر الأصلي غير صحيح';
    if (!form.discountValue || parseFloat(form.discountValue) <= 0) errs.discountValue = 'قيمة الخصم مطلوبة';
    if (form.discountType === 'percentage' && parseFloat(form.discountValue) > 100) errs.discountValue = 'النسبة لا يمكن أن تتجاوز 100%';
    if (parseFloat(form.finalPrice) < 0) errs.finalPrice = 'السعر النهائي لا يمكن أن يكون سالباً';
    if (!form.startDate) errs.startDate = 'يرجى تحديد تاريخ البداية';
    if (!form.endDate) errs.endDate = 'يرجى تحديد تاريخ النهاية';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload: any = {
      itemId: form.itemId,
      priceKey: form.priceKey,
      originalPrice: parseFloat(form.originalPrice),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      finalPrice: parseFloat(form.finalPrice),
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
      order: parseInt(form.order) || 0,
      createdAt: editingPromotion?.createdAt || Date.now(),
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }
    // أرسل الحقل دائماً حتى يؤدي حذف الصورة من النموذج إلى حذفها من Firebase
    // بدلاً من ترك القيمة القديمة محفوظة.
    payload.image = form.image.trim();

    await onSave(payload as Omit<Promotion, 'id'>);
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all border ${hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-amber-500/15 bg-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10'
    }`;

  const labelClass = 'block text-xs font-black text-neutral-500 uppercase tracking-widest mb-1.5 px-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-3xl border border-amber-500/12 shadow-sm overflow-hidden"
    >
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-amber-500/10 flex items-center justify-between bg-amber-500/3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            {editingPromotion ? <FiEdit size={18} /> : <FiPlus size={18} />}
          </div>
          <div>
            <h3 className="font-black text-neutral-900 text-base">
              {editingPromotion ? 'تعديل العرض' : 'إضافة عرض جديد'}
            </h3>
            <p className="text-xs text-neutral-400 font-medium">جميع الحقول المميزة بـ * مطلوبة</p>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors">
          <FiX size={16} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Row 1: Item + Price Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>الصنف *</label>
            <select
              className={inputClass(!!errors.itemId)}
              value={form.itemId}
              onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
            >
              <option value="">— اختر الصنف —</option>
              {Object.entries(items)
                .sort(([, a]: any, [, b]: any) => (a.nameAr || '').localeCompare(b.nameAr || ''))
                .map(([id, item]: any) => (
                  <option key={id} value={id}>{item.nameAr || item.name}</option>
                ))}
            </select>
            {errors.itemId && <p className="text-red-500 text-xs mt-1 px-1">{errors.itemId}</p>}
          </div>

          <div>
            <label className={labelClass}>السعر / الحجم</label>
            <select
              className={inputClass()}
              value={form.priceKey}
              onChange={e => {
                const key = e.target.value as PriceKey;
                const chosen = availablePrices.find(p => p.key === key);
                setForm(f => ({ ...f, priceKey: key, originalPrice: chosen ? String(chosen.value) : '' }));
              }}
              disabled={availablePrices.length <= 1}
            >
              {availablePrices.length === 0
                ? <option value="price">— اختر صنفاً أولاً —</option>
                : availablePrices.map(p => <option key={p.key} value={p.key}>{p.label}</option>)
              }
            </select>
          </div>
        </div>

        {/* Row 2: Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>السعر الأصلي (₪)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass(!!errors.originalPrice)}
              placeholder="0.00"
              value={form.originalPrice}
              readOnly
            />
            {errors.originalPrice && <p className="text-red-500 text-xs mt-1 px-1">{errors.originalPrice}</p>}
          </div>

          <div>
            <label className={labelClass}>نوع الخصم</label>
            <div className="flex rounded-2xl border border-amber-500/15 overflow-hidden bg-white h-[46px]">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, discountType: 'percentage' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${form.discountType === 'percentage' ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:bg-amber-500/5'
                  }`}
              >
                <FiPercent size={13} /> نسبة %
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${form.discountType === 'fixed' ? 'bg-amber-500 text-white' : 'text-neutral-500 hover:bg-amber-500/5'
                  }`}
              >
                <FiDollarSign size={13} /> مبلغ ₪
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>قيمة الخصم *</label>
            <input
              type="number"
              min="0"
              max={form.discountType === 'percentage' ? 100 : undefined}
              step="0.01"
              className={inputClass(!!errors.discountValue)}
              placeholder={form.discountType === 'percentage' ? '20' : '5.00'}
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
            />
            {errors.discountValue && <p className="text-red-500 text-xs mt-1 px-1">{errors.discountValue}</p>}
          </div>
        </div>

        {/* Final Price */}
        {form.finalPrice && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <FiCheck className="text-emerald-600 shrink-0" size={18} />
            <div>
              <p className="text-xs text-emerald-600 font-bold">السعر بعد الخصم</p>
              <p className="text-2xl font-black text-emerald-700">{parseFloat(form.finalPrice).toFixed(2)} ₪</p>
            </div>
            {form.originalPrice && form.finalPrice && (
              <div className="mr-auto bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-black">
                وفّر {(parseFloat(form.originalPrice) - parseFloat(form.finalPrice)).toFixed(2)} ₪
              </div>
            )}
          </div>
        )}

        {/* Row 3: Title + Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>عنوان العرض *</label>
            <input
              type="text"
              className={inputClass(!!errors.title)}
              placeholder="مثال: عرض نهاية الأسبوع"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1 px-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClass}>وصف مختصر (اختياري)</label>
            <input
              type="text"
              className={inputClass()}
              placeholder="وصف قصير للعرض..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        {/* Row 4: Image Selector */}
        <div>
          <label className={labelClass}><FiImage size={12} className="inline ml-1" />صورة العرض (اختياري)</label>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
            {form.image ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                <img
                  src={form.image.startsWith('http') || form.image.startsWith('/') ? form.image : `/images/${form.image}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.src = '/jannah-logo.jpg'; }}
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, image: '' }))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                >
                  <FiX size={10} />
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                <img src="/jannah-logo.jpg" alt="الصورة الافتراضية" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="flex-1 text-xs font-bold text-neutral-500 truncate" dir="ltr">
              {form.image || 'لم يتم اختيار صورة'}
            </span>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-snouno-dark font-black hover:bg-amber-400 transition-all shrink-0 flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
            >
              <FiImage size={15} />
              <span>معرض الصور</span>
            </button>
          </div>
        </div>

        {/* Gallery Modal */}
        <FeaturedGallery
          visible={showGallery}
          onClose={() => setShowGallery(false)}
          onSelect={(img) => {
            setForm(f => ({ ...f, image: img }));
            setShowGallery(false);
          }}
          manifestPath="/images/manifest.json"
          selectedImage={form.image}
          title="اختر صورة للعرض الترويجي"
        />

        {/* Row 5: Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}><FiCalendar size={12} className="inline ml-1" />تاريخ البداية *</label>
            <input
              type="date"
              className={inputClass(!!errors.startDate)}
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
            {errors.startDate && <p className="text-red-500 text-xs mt-1 px-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className={labelClass}><FiClock size={12} className="inline ml-1" />عدد الأيام</label>
            <input
              type="number"
              min="1"
              className={inputClass()}
              placeholder="7"
              value={form.durationDays}
              onChange={e => handleDurationChange(e.target.value)}
            />
            <p className="text-[10px] text-neutral-400 px-1 mt-1">اختصار لتحديد تاريخ النهاية</p>
          </div>

          <div>
            <label className={labelClass}>تاريخ النهاية *</label>
            <input
              type="date"
              className={inputClass(!!errors.endDate)}
              value={form.endDate}
              min={form.startDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value, durationDays: '' }))}
            />
            {errors.endDate && <p className="text-red-500 text-xs mt-1 px-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* Row 6: Order + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ترتيب العرض</label>
            <input
              type="number"
              min="0"
              className={inputClass()}
              placeholder="0"
              value={form.order}
              onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelClass}>حالة العرض</label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`w-full h-[46px] rounded-2xl border flex items-center justify-between px-4 transition-all font-bold text-sm ${form.isActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                }`}
            >
              <span>{form.isActive ? 'مفعّل' : 'متوقف'}</span>
              {form.isActive ? <FiToggleRight size={22} className="text-emerald-500" /> : <FiToggleLeft size={22} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl bg-amber-500 text-snouno-dark font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                <FiClock size={16} />
              </motion.div>
            ) : <FiCheck size={16} />}
            {editingPromotion ? 'حفظ التعديلات' : 'إضافة العرض'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 h-12 rounded-2xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-50 transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PROMOTION ROW (LIST)
   ═══════════════════════════════════════ */
function PromotionRow({
  promotion,
  itemName,
  itemImage,
  onEdit,
  onDelete,
  onToggle,
}: {
  promotion: Promotion;
  itemName: string;
  itemImage?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const status = getPromotionStatus(promotion);
  const daysLeft = getDaysRemaining(promotion);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full bg-white rounded-2xl border border-amber-500/10 p-3 sm:p-4 grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-center hover:border-amber-500/25 hover:shadow-sm transition-all"
    >
      {/* Image */}
      <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50 flex items-center justify-center">
        {(promotion.image || itemImage) ? (
          <img
            src={promotion.image 
              ? (promotion.image.startsWith('http') || promotion.image.startsWith('/') ? promotion.image : `/images/${promotion.image}`)
              : (itemImage?.startsWith('http') || itemImage?.startsWith('/') ? itemImage : `/images/${itemImage}`)}
            alt={promotion.title}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.src = '/jannah-logo.jpg'; }}
          />
        ) : (
          <img src="/jannah-logo.jpg" alt="جنة" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-black text-neutral-900 text-sm">{promotion.title}</h4>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{itemName}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-xs text-neutral-400 line-through">{promotion.originalPrice} ₪</span>
          <span className="text-sm font-black text-amber-600">{promotion.finalPrice} ₪</span>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {promotion.discountType === 'percentage'
              ? `-${promotion.discountValue}%`
              : `-${promotion.discountValue} ₪`}
          </span>
          {daysLeft !== null && (
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <FiClock size={10} /> متبقي {daysLeft} أيام
            </span>
          )}
        </div>
        <p className="text-[10px] text-neutral-400 mt-1">
          {promotion.startDate} — {promotion.endDate}
        </p>
      </div>

      {/* Actions */}
      <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2 shrink-0 border-t border-neutral-100 pt-2 sm:border-0 sm:pt-0">
        <button
          onClick={onToggle}
          title={promotion.isActive ? 'إيقاف' : 'تفعيل'}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${promotion.isActive
              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
            }`}
        >
          {promotion.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
        </button>
        <button
          onClick={onEdit}
          className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-all"
        >
          <FiEdit size={15} />
        </button>
        <button
          onClick={onDelete}
          className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"
        >
          <FiTrash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [items, setItems] = useState<Record<string, any>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PromotionStatus>('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Firebase listeners
  useEffect(() => {
    const unsubPromotions = PromotionService.subscribe(setPromotions);
    const unsubItems = onValue(ref(db, 'items'), snap => {
      setItems(snap.val() || {});
    });
    return () => {
      unsubPromotions();
      unsubItems();
    };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const statMap = { active: 0, scheduled: 0, expired: 0, inactive: 0 };
    promotions.forEach(p => statMap[getPromotionStatus(p)]++);
    return statMap;
  }, [promotions]);

  // Filtered
  const filtered = useMemo(() => {
    return promotions.filter(p => {
      const status = getPromotionStatus(p);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (search) {
        const item = items[p.itemId];
        const name = (item?.nameAr || item?.name || '').toLowerCase();
        const title = p.title.toLowerCase();
        return name.includes(search.toLowerCase()) || title.includes(search.toLowerCase());
      }
      return true;
    });
  }, [promotions, items, search, statusFilter]);

  const handleSave = async (data: Omit<Promotion, 'id'>) => {
    setSaving(true);
    try {
      if (editingPromotion) {
        await PromotionService.update(editingPromotion.id, data);
        showToast('تم تحديث العرض ✅');
      } else {
        await PromotionService.create(data);
        showToast('تمت إضافة العرض ✅');
      }
      setShowForm(false);
      setEditingPromotion(null);
    } catch (err) {
      console.error("Error saving promotion:", err);
      showToast('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    setDeleting(id);
    try {
      await PromotionService.delete(id);
      showToast('تم حذف العرض');
    } catch {
      showToast('فشل الحذف', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (promotion: Promotion) => {
    await PromotionService.toggle(promotion.id, promotion.isActive);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPromotion(null);
  };

  const statCards = [
    { label: 'العروض النشطة', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', filter: 'active' as const },
    { label: 'العروض المجدولة', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', filter: 'scheduled' as const },
    { label: 'العروض المنتهية', value: stats.expired, color: 'text-neutral-400', bg: 'bg-neutral-50', border: 'border-neutral-200', filter: 'expired' as const },
    { label: 'العروض المتوقفة', value: stats.inactive, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', filter: 'inactive' as const },
  ];

  return (
    <AdminLayout
      title="العروض والترويج"
      subtitle="إدارة العروض والأصناف الجديدة والعروض محدودة المدة"
    >
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div />
          <button
            onClick={() => { setEditingPromotion(null); setShowForm(true); }}
            className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-amber-500 text-snouno-dark font-black text-sm shadow-sm hover:bg-amber-600 transition-all"
          >
            <FiPlus size={18} />
            <span>+ إضافة عرض</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(card => (
            <button
              key={card.filter}
              onClick={() => setStatusFilter(statusFilter === card.filter ? 'all' : card.filter)}
              className={`p-4 rounded-2xl border text-right transition-all hover:shadow-sm ${card.bg} ${card.border} ${statusFilter === card.filter ? 'ring-2 ring-offset-1 ring-amber-400' : ''
                }`}
            >
              <span className={`text-2xl font-black block ${card.color}`}>{card.value}</span>
              <span className="text-xs font-semibold text-neutral-500 mt-0.5 block">{card.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <PromotionForm
              items={items}
              editingPromotion={editingPromotion}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
            />
          )}
        </AnimatePresence>

        {/* Search + Filter */}
        <div className="bg-white rounded-3xl border border-amber-500/12 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <h2 className="text-base font-black text-neutral-900">العروض الحالية</h2>
            <span className="text-xs text-neutral-400 font-medium mr-auto">
              {filtered.length} من {promotions.length} عرض
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="بحث بالاسم أو عنوان العرض..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-amber-500/15 bg-neutral-50 pr-10 pl-4 py-2.5 text-sm font-medium outline-none focus:border-amber-500/40 focus:bg-white transition-all"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'scheduled', 'expired', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${statusFilter === f
                    ? 'bg-amber-500 text-snouno-dark border-amber-500'
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-amber-300'
                  }`}
              >
                {f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : f === 'scheduled' ? 'مجدول' : f === 'expired' ? 'منتهي' : 'متوقف'}
              </button>
            ))}
          </div>

          {/* Promotions List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <FiTag size={28} className="text-neutral-300" />
                  </div>
                  <p className="font-bold text-neutral-400 text-sm">
                    {promotions.length === 0 ? 'لا توجد عروض بعد، أضف أول عرض!' : 'لا توجد نتائج مطابقة'}
                  </p>
                </motion.div>
              ) : (
                filtered.map(p => {
                  const item = items[p.itemId];
                  return (
                    <PromotionRow
                      key={p.id}
                      promotion={p}
                      itemName={item?.nameAr || item?.name || 'صنف غير موجود'}
                      itemImage={item?.image}
                      onEdit={() => handleEdit(p)}
                      onDelete={() => !deleting && handleDelete(p.id)}
                      onToggle={() => handleToggle(p)}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Warning for expired active promotions */}
      {promotions.some(p => p.isActive && getPromotionStatus(p) === 'expired') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-6 z-50 bg-amber-500 text-snouno-dark px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold max-w-xs"
        >
          <FiAlertCircle size={16} />
          <span>يوجد عروض منتهية الصلاحية ومفعّلة — ستُخفى تلقائياً عن الزوار</span>
        </motion.div>
      )}
    </AdminLayout>
  );
}
