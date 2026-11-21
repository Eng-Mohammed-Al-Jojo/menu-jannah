import { db } from '../firebase';
import {
  ref,
  push,
  update,
  remove,
  onValue,
  get,
  set,
  type Unsubscribe,
} from 'firebase/database';
import type { Promotion, PromotionRaw, OpeningHours } from '../types/promotion';
import { DEFAULT_OPENING_HOURS } from '../types/promotion';

const PROMOTIONS_PATH = 'promotions';
const OPENING_HOURS_PATH = 'settings/openingHours';

function sanitize<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
}

export const PromotionService = {
  /* ─────────────────────────────────────────
     PROMOTIONS CRUD
     ───────────────────────────────────────── */

  /** إضافة عرض جديد */
  async create(data: PromotionRaw): Promise<string | null> {
    const cleaned = sanitize(data);
    const newRef = push(ref(db, PROMOTIONS_PATH));
    await set(newRef, cleaned);
    return newRef.key;
  },

  /** تحديث عرض موجود */
  async update(id: string, data: Partial<PromotionRaw>): Promise<void> {
    const cleaned = sanitize(data);
    await update(ref(db, `${PROMOTIONS_PATH}/${id}`), cleaned);
  },

  /** حذف عرض */
  async delete(id: string): Promise<void> {
    await remove(ref(db, `${PROMOTIONS_PATH}/${id}`));
  },

  /** تفعيل/إيقاف عرض */
  async toggle(id: string, currentActive: boolean): Promise<void> {
    await update(ref(db, `${PROMOTIONS_PATH}/${id}`), {
      isActive: !currentActive,
    });
  },

  /** تعطيل العروض المرتبطة بصنف محذوف أو تغيّرت متغيراته، مع إبقاء سجل العرض للتدقيق. */
  async deactivateForItem(itemId: string, reason: 'item_deleted' | 'variants_changed'): Promise<void> {
    const snap = await get(ref(db, PROMOTIONS_PATH));
    if (!snap.exists()) return;
    const updates: Record<string, unknown> = {};
    Object.entries(snap.val() as Record<string, any>).forEach(([id, promotion]) => {
      if (promotion?.itemId === itemId && promotion?.isActive !== false) {
        updates[`${PROMOTIONS_PATH}/${id}/isActive`] = false;
        updates[`${PROMOTIONS_PATH}/${id}/disabledReason`] = reason;
        updates[`${PROMOTIONS_PATH}/${id}/needsReview`] = reason === 'variants_changed';
      }
    });
    if (Object.keys(updates).length > 0) await update(ref(db), updates);
  },

  /** جلب جميع العروض مرة واحدة */
  async getAll(): Promise<Promotion[]> {
    const snap = await get(ref(db, PROMOTIONS_PATH));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, v]: [string, any]) => ({
      id,
      ...v,
    }));
  },

  /**
   * الاستماع لتغييرات العروض في real-time
   * يُرجع دالة إلغاء الاشتراك
   */
  subscribe(callback: (promotions: Promotion[]) => void, onError?: (error: Error) => void): Unsubscribe {
    return onValue(ref(db, PROMOTIONS_PATH), (snap) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      const promotions: Promotion[] = Object.entries(snap.val()).map(
        ([id, v]: [string, any]) => ({ id, ...v })
      );
      callback(promotions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }, (error) => onError?.(error));
  },

  /* ─────────────────────────────────────────
     OPENING HOURS CRUD
     ───────────────────────────────────────── */

  /** جلب ساعات العمل مع fallback للقيم الافتراضية */
  async getOpeningHours(): Promise<OpeningHours> {
    const snap = await get(ref(db, OPENING_HOURS_PATH));
    if (!snap.exists()) return DEFAULT_OPENING_HOURS;
    return { ...DEFAULT_OPENING_HOURS, ...snap.val() };
  },

  /** حفظ ساعات العمل */
  async saveOpeningHours(hours: OpeningHours): Promise<void> {
    await update(ref(db, 'settings'), { openingHours: hours });
  },

  /** الاستماع لساعات العمل في real-time */
  subscribeOpeningHours(callback: (hours: OpeningHours) => void): Unsubscribe {
    return onValue(ref(db, OPENING_HOURS_PATH), (snap) => {
      if (!snap.exists()) {
        callback(DEFAULT_OPENING_HOURS);
        return;
      }
      callback({ ...DEFAULT_OPENING_HOURS, ...snap.val() });
    });
  },
};
