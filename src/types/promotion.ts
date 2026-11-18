/**
 * Promotion Types — Digital Menu Snounu
 * العروض مستقلة تمامًا عن items ومرتبطة بها عبر itemId فقط
 */

export type DiscountType = 'percentage' | 'fixed';
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'inactive';
export type PriceKey = 'price' | 'priceTw';

export interface Promotion {
  id: string;
  title: string;
  description?: string;

  // الصنف المرتبط
  itemId: string;
  priceKey: PriceKey; // على أي سعر ينطبق العرض

  // التسعير
  originalPrice: number;
  discountType: DiscountType;
  discountValue: number;
  finalPrice: number; // محسوب تلقائياً ومخزن للأداء

  // الصورة
  image?: string;

  // التوقيت
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string;   // ISO date string "YYYY-MM-DD"

  // الحالة
  isActive: boolean;
  order: number;
  createdAt: number;
}

/** Raw data from Firebase (بدون id) */
export type PromotionRaw = Omit<Promotion, 'id'>;

/**
 * حساب حالة العرض الحقيقية بناءً على:
 * isActive + startDate + endDate + الوقت الحالي
 */
export function getPromotionStatus(promotion: Promotion): PromotionStatus {
  if (!promotion.isActive) return 'inactive';

  const now = new Date();
  const start = new Date(promotion.startDate);
  const end = new Date(promotion.endDate + 'T23:59:59'); // نهاية اليوم

  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}

/**
 * هل العرض يجب أن يظهر للمستخدم؟
 * فقط العروض الفعالة الآن
 */
export function isPromotionVisible(promotion: Promotion): boolean {
  return getPromotionStatus(promotion) === 'active';
}

/**
 * حساب السعر بعد الخصم
 */
export function calculateFinalPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === 'percentage') {
    const discount = Math.min(100, Math.max(0, discountValue));
    return Math.max(0, originalPrice - (originalPrice * discount) / 100);
  } else {
    return Math.max(0, originalPrice - discountValue);
  }
}

/**
 * حساب نسبة الخصم الفعلية للعرض
 */
export function getDiscountPercentage(
  originalPrice: number,
  finalPrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

/**
 * الأيام المتبقية حتى انتهاء العرض
 * إرجاع null إذا انتهى أو لم يبدأ
 */
export function getDaysRemaining(promotion: Promotion): number | null {
  const status = getPromotionStatus(promotion);
  if (status !== 'active') return null;

  const now = new Date();
  const end = new Date(promotion.endDate + 'T23:59:59');
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Opening Hours Types */
export interface DaySchedule {
  enabled: boolean;
  open: string;  // "09:00"
  close: string; // "23:00"
}

export type DayKey =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export type OpeningHours = Record<DayKey, DaySchedule>;

export const DAY_LABELS: Record<DayKey, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

export const DAY_KEYS: DayKey[] = [
  'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
];

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  saturday:  { enabled: true,  open: '09:00', close: '23:00' },
  sunday:    { enabled: true,  open: '09:00', close: '23:00' },
  monday:    { enabled: true,  open: '09:00', close: '23:00' },
  tuesday:   { enabled: true,  open: '09:00', close: '23:00' },
  wednesday: { enabled: true,  open: '09:00', close: '23:00' },
  thursday:  { enabled: true,  open: '09:00', close: '23:00' },
  friday:    { enabled: false, open: '14:00', close: '23:00' },
};

/**
 * هل المطعم مفتوح الآن؟
 */
export function isRestaurantOpen(hours: OpeningHours): boolean {
  const now = new Date();
  const days: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = days[now.getDay()];
  const today = hours[todayKey];

  if (!today?.enabled) return false;

  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // دعم ساعات العمل التي تتجاوز منتصف الليل
  if (closeMinutes <= openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
