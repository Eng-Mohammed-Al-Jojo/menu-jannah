import { useState, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSettings, FiSmartphone, FiLayout, FiTruck, FiCoffee,
  FiClock, FiCheck, FiInfo, FiGlobe,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/admin/AdminLayout';
import {
  type OpeningHours,
  type DayKey,
  DAY_LABELS,
  DAY_KEYS,
  DEFAULT_OPENING_HOURS,
} from '../types/promotion';
import { PromotionService } from '../services/promotionService';
import { ORDER_SYSTEM_ENABLED } from '../config/orderSystem';

/* ═══════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════ */
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="font-black text-neutral-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   TOGGLE SWITCH
   ═══════════════════════════════════════ */
function ToggleSwitch({ enabled, onToggle, label, description }: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-bold text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative w-12 h-6.5 rounded-full transition-all duration-300 border shrink-0 ${
          enabled ? 'bg-emerald-500 border-emerald-600' : 'bg-neutral-200 border-neutral-300'
        }`}
      >
        <motion.span
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 left-0 w-4.5 h-4.5 rounded-full bg-white shadow-sm z-10"
        />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   FIELD
   ═══════════════════════════════════════ */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-black text-neutral-500 uppercase tracking-widest px-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-amber-500/15 bg-neutral-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-amber-500/40 focus:bg-white transition-all placeholder:text-neutral-300";

/* ═══════════════════════════════════════
   OPENING HOURS DAY ROW
   ═══════════════════════════════════════ */
function DayRow({ dayKey, schedule, onChange }: {
  dayKey: DayKey;
  schedule: { enabled: boolean; open: string; close: string };
  onChange: (key: DayKey, value: Partial<{ enabled: boolean; open: string; close: string }>) => void;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 py-3.5 border-b border-neutral-50 last:border-0 transition-all ${!schedule.enabled ? 'opacity-50' : ''}`}>
      {/* Toggle + Day Name */}
      <div className="flex items-center gap-3 sm:w-32 shrink-0">
        <button
          type="button"
          onClick={() => onChange(dayKey, { enabled: !schedule.enabled })}
          className={`relative w-10 h-5.5 rounded-full transition-all duration-300 border shrink-0 ${
            schedule.enabled ? 'bg-emerald-500 border-emerald-600' : 'bg-neutral-200 border-neutral-300'
          }`}
        >
          <motion.span
            animate={{ x: schedule.enabled ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm z-10"
          />
        </button>
        <span className="text-sm font-bold text-neutral-800 shrink-0">{DAY_LABELS[dayKey]}</span>
      </div>

      {/* Time Inputs */}
      {schedule.enabled ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="time"
            value={schedule.open}
            onChange={e => onChange(dayKey, { open: e.target.value })}
            className="flex-1 rounded-xl border border-amber-500/15 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-amber-500/40 focus:bg-white transition-all"
          />
          <span className="text-neutral-300 font-black shrink-0">—</span>
          <input
            type="time"
            value={schedule.close}
            onChange={e => onChange(dayKey, { close: e.target.value })}
            className="flex-1 rounded-xl border border-amber-500/15 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-amber-500/40 focus:bg-white transition-all"
          />
        </div>
      ) : (
        <div className="flex-1">
          <span className="text-xs font-bold text-neutral-400 px-3 py-2 inline-block bg-neutral-100 rounded-xl">مغلق</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   TOAST
   ═══════════════════════════════════════ */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 30, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3.5 rounded-full shadow-xl font-bold text-sm border ${
        type === 'success'
          ? 'bg-snouno-dark text-amber-400 border-amber-500/25'
          : 'bg-red-600 text-white border-red-500/40'
      }`}
    >
      {message}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   SAVE BUTTON
   ═══════════════════════════════════════ */
function SaveButton({ onClick, saving, label = 'حفظ التغييرات' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-amber-500 text-snouno-dark font-black text-sm shadow-sm hover:bg-amber-600 transition-all disabled:opacity-50"
    >
      {saving ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
          <FiSettings size={16} />
        </motion.div>
      ) : <FiCheck size={16} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════
   SECTION CARD
   ═══════════════════════════════════════ */
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-3xl border border-amber-500/12 shadow-xs p-5 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function AdminSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // ─── Order Settings ───
  const [orderSystem, setOrderSystem] = useState(ORDER_SYSTEM_ENABLED);
  const [orderMode, setOrderMode] = useState<'dashboard' | 'whatsapp'>('dashboard');
  const [inRestaurant, setInRestaurant] = useState(true);
  const [takeaway, setTakeaway] = useState(true);
  const [inPhone, setInPhone] = useState('');
  const [outPhone, setOutPhone] = useState('');
  const [complaintsWhatsapp, setComplaintsWhatsapp] = useState('');

  // ─── Footer Info ───
  const [footer, setFooter] = useState({
    address: '', phone: '', whatsapp: '',
    facebook: '', instagram: '', tiktok: '', telegram: '',
  });

  // ─── Currency ───
  const [currency, setCurrency] = useState('₪');

  // ─── Opening Hours ───
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // تحميل الإعدادات
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(settingsRef, snap => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val();
      const s = data.orderSettings ?? {};
      setOrderSystem(ORDER_SYSTEM_ENABLED && (data.orderSystem !== undefined ? !!data.orderSystem : true));
      setOrderMode(data.orderMode || 'dashboard');
      setInRestaurant(s.inRestaurant !== undefined ? !!s.inRestaurant : true);
      setTakeaway(s.takeaway !== undefined ? !!s.takeaway : true);
      setInPhone(s.inPhone || '');
      setOutPhone(s.outPhone || '');
      setComplaintsWhatsapp(data.complaintsWhatsapp || '');
      setFooter({ address: '', phone: '', whatsapp: '', facebook: '', instagram: '', tiktok: '', telegram: '', ...(data.footerInfo || {}) });
      setCurrency(data.currency || '₪');
      setLoading(false);
    });

    const unsubHours = PromotionService.subscribeOpeningHours(hours => {
      setOpeningHours(hours);
    });

    return () => { unsubSettings(); unsubHours(); };
  }, []);

  // ─── Save: Order Settings ───
  const saveOrderSettings = async () => {
    if (orderMode === 'whatsapp') {
      if (!inRestaurant && !takeaway) {
        showToast('يجب تفعيل خدمة واحدة على الأقل', 'error'); return;
      }
      if ((inRestaurant && !inPhone.trim()) || (takeaway && !outPhone.trim())) {
        showToast('رقم واتساب مطلوب للخدمات المفعّلة', 'error'); return;
      }
    }
    setSaving('order');
    try {
      await update(ref(db, 'settings'), {
        orderSystem: ORDER_SYSTEM_ENABLED && orderSystem, orderMode,
        orderSettings: { inRestaurant, takeaway, inPhone, outPhone },
        complaintsWhatsapp,
      });
      showToast('تم حفظ إعدادات الطلب ✅');
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ─── Save: Footer ───
  const saveFooter = async () => {
    setSaving('footer');
    try {
      await update(ref(db, 'settings'), { footerInfo: footer });
      showToast('تم حفظ معلومات المنيو ✅');
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ─── Save: Currency ───
  const saveCurrency = async () => {
    setSaving('currency');
    try {
      await update(ref(db, 'settings'), { currency });
      showToast('تم حفظ إعداد العملة ✅');
    } catch {
      showToast('حدث خطأ', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ─── Save: Opening Hours ───
  const saveOpeningHours = async () => {
    setSaving('hours');
    try {
      await PromotionService.saveOpeningHours(openingHours);
      showToast('تم حفظ ساعات العمل ✅');
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(null);
    }
  };

  const updateDaySchedule = (key: DayKey, value: Partial<{ enabled: boolean; open: string; close: string }>) => {
    setOpeningHours(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value },
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="إعدادات النظام" subtitle="تكوين إعدادات المطعم">
        <div className="flex items-center justify-center py-32">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
            <FiSettings size={28} className="text-amber-400" />
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="إعدادات النظام"
      subtitle="تكوين المطعم وإعدادات الطلب وساعات العمل"
    >
      <div className="space-y-6 pb-12 max-w-3xl mx-auto">

        {/* ─── Section 1: معلومات المنيو ─── */}
        <SectionCard>
          <SectionHeader icon={FiLayout} title="معلومات المنيو" subtitle="البيانات التي تظهر في الـ Footer" />
          <div className="space-y-4">
            <Field label="العنوان">
              <input className={inputCls} placeholder="عنوان المطعم" value={footer.address} onChange={e => setFooter(f => ({ ...f, address: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="رقم الهاتف">
                <div className="relative">
                  <FiSmartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                  <input className={inputCls + ' pr-9'} placeholder="+970..." dir="ltr" value={footer.phone} onChange={e => setFooter(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </Field>
              <Field label="واتساب">
                <div className="relative">
                  <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
                  <input className={inputCls + ' pr-9'} placeholder="9701234..." dir="ltr" value={footer.whatsapp} onChange={e => setFooter(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="فيسبوك">
                <div className="relative">
                  <FaFacebook className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" size={15} />
                  <input className={inputCls + ' pr-9 text-xs'} placeholder="رابط صفحة فيسبوك" dir="ltr" value={footer.facebook} onChange={e => setFooter(f => ({ ...f, facebook: e.target.value }))} />
                </div>
              </Field>
              <Field label="إنستغرام">
                <div className="relative">
                  <FaInstagram className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500" size={15} />
                  <input className={inputCls + ' pr-9 text-xs'} placeholder="رابط حساب إنستغرام" dir="ltr" value={footer.instagram} onChange={e => setFooter(f => ({ ...f, instagram: e.target.value }))} />
                </div>
              </Field>
              <Field label="تيك توك">
                <div className="relative">
                  <FaTiktok className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-700" size={14} />
                  <input className={inputCls + ' pr-9 text-xs'} placeholder="رابط حساب تيك توك" dir="ltr" value={footer.tiktok} onChange={e => setFooter(f => ({ ...f, tiktok: e.target.value }))} />
                </div>
              </Field>
              <Field label="تيليغرام">
                <div className="relative">
                  <FiGlobe className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-500" size={15} />
                  <input className={inputCls + ' pr-9 text-xs'} placeholder="رابط تيليغرام" dir="ltr" value={footer.telegram} onChange={e => setFooter(f => ({ ...f, telegram: e.target.value }))} />
                </div>
              </Field>
            </div>
            <div className="flex justify-end pt-2">
              <SaveButton onClick={saveFooter} saving={saving === 'footer'} />
            </div>
          </div>
        </SectionCard>

        {/* ─── Section 2: إعدادات الطلب ─── */}
        <SectionCard>
          <SectionHeader icon={FiSmartphone} title="إعدادات الطلب" subtitle="تحكم في نظام استقبال الطلبات" />
          <div className="space-y-6">
            {/* Order System Toggle */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
              <ToggleSwitch
                enabled={orderSystem}
                onToggle={() => undefined}
                label="نظام استقبال الطلبات"
                description="معطّل برمجيًا — يمكن تفعيله من الكود فقط"
              />
            </div>

            {/* Order Mode */}
            <div className="space-y-3">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">وضع استقبال الطلبات</p>
              <div className="grid grid-cols-2 gap-2">
                {(['dashboard', 'whatsapp'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOrderMode(mode)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                      orderMode === mode
                        ? 'bg-amber-500 text-snouno-dark border-amber-500'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-amber-300'
                    }`}
                  >
                    {mode === 'dashboard' ? '📋 لوحة التحكم' : '💬 واتساب'}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* In Restaurant */}
              <div className={`p-4 rounded-2xl border transition-all ${inRestaurant ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-100 bg-neutral-50 opacity-70'} ${!orderSystem ? 'pointer-events-none opacity-40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiCoffee size={16} className="text-amber-500" />
                    <span className="text-sm font-bold">{t('admin.local_ordering') || 'داخل المطعم'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInRestaurant(p => !p)}
                    disabled={!orderSystem}
                    className={`relative w-10 h-5.5 rounded-full transition-all border ${inRestaurant ? 'bg-emerald-500 border-emerald-600' : 'bg-neutral-200 border-neutral-300'}`}
                  >
                    <motion.span animate={{ x: inRestaurant ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm z-10" />
                  </button>
                </div>
                {orderMode === 'whatsapp' && inRestaurant && (
                  <div className="relative mt-2">
                    <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={13} />
                    <input className="w-full rounded-xl border border-neutral-200 bg-white pr-8 pl-3 py-2 text-xs font-bold outline-none focus:border-amber-400" placeholder="970xxxxxxxx" dir="ltr" value={inPhone} onChange={e => setInPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                )}
              </div>

              {/* Takeaway */}
              <div className={`p-4 rounded-2xl border transition-all ${takeaway ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-100 bg-neutral-50 opacity-70'} ${!orderSystem ? 'pointer-events-none opacity-40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FiTruck size={16} className="text-amber-500" />
                    <span className="text-sm font-bold">{t('admin.takeaway_delivery') || 'توصيل / تيك أواي'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTakeaway(p => !p)}
                    disabled={!orderSystem}
                    className={`relative w-10 h-5.5 rounded-full transition-all border ${takeaway ? 'bg-emerald-500 border-emerald-600' : 'bg-neutral-200 border-neutral-300'}`}
                  >
                    <motion.span animate={{ x: takeaway ? 18 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm z-10" />
                  </button>
                </div>
                {orderMode === 'whatsapp' && takeaway && (
                  <div className="relative mt-2">
                    <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={13} />
                    <input className="w-full rounded-xl border border-neutral-200 bg-white pr-8 pl-3 py-2 text-xs font-bold outline-none focus:border-amber-400" placeholder="970xxxxxxxx" dir="ltr" value={outPhone} onChange={e => setOutPhone(e.target.value.replace(/\D/g, ''))} />
                  </div>
                )}
              </div>
            </div>

            {/* Complaints Whatsapp */}
            <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-200/50">
              <div className="flex items-center gap-2 mb-3">
                <FiInfo size={15} className="text-amber-500" />
                <span className="text-sm font-bold text-neutral-800">واتساب الشكاوى والملاحظات</span>
              </div>
              <div className="relative">
                <FaWhatsapp className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
                <input className={inputCls + ' pr-9'} placeholder="970xxxxxxxx" dir="ltr" value={complaintsWhatsapp} onChange={e => setComplaintsWhatsapp(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>

            <div className="flex justify-end">
              <SaveButton onClick={saveOrderSettings} saving={saving === 'order'} />
            </div>
          </div>
        </SectionCard>

        {/* ─── Section 3: العملة ─── */}
        <SectionCard>
          <SectionHeader icon={FiGlobe} title="العملة" subtitle="الرمز الذي يظهر مع الأسعار في المنيو" />
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Field label="رمز العملة">
                <div className="flex gap-2 flex-wrap">
                  {['₪', 'د.إ', 'ر.س', '$', '€', 'JD'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`h-10 px-4 rounded-xl text-sm font-black border transition-all ${
                        currency === c
                          ? 'bg-amber-500 text-snouno-dark border-amber-500'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-amber-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <input
                    className={inputCls + ' w-24 h-10 text-center'}
                    placeholder="أخرى"
                    value={!['₪', 'د.إ', 'ر.س', '$', '€', 'JD'].includes(currency) ? currency : ''}
                    onChange={e => setCurrency(e.target.value)}
                  />
                </div>
              </Field>
            </div>
            <SaveButton onClick={saveCurrency} saving={saving === 'currency'} />
          </div>
        </SectionCard>

        {/* ─── Section 4: ساعات العمل ─── */}
        <SectionCard>
          <SectionHeader icon={FiClock} title="ساعات العمل" subtitle="حدد أوقات فتح وإغلاق المطعم لكل يوم" />

          {/* Quick Actions */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <button
              type="button"
              onClick={() => setOpeningHours(prev => {
                const updated = { ...prev };
                DAY_KEYS.forEach(k => { updated[k] = { ...updated[k], enabled: true }; });
                return updated;
              })}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
            >
              فتح الكل
            </button>
            <button
              type="button"
              onClick={() => setOpeningHours(prev => {
                const updated = { ...prev };
                DAY_KEYS.forEach(k => { updated[k] = { ...updated[k], enabled: false }; });
                return updated;
              })}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
            >
              إغلاق الكل
            </button>
            <button
              type="button"
              onClick={() => setOpeningHours(DEFAULT_OPENING_HOURS)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200 transition-all"
            >
              إعادة تعيين
            </button>
          </div>

          {/* Days */}
          <div className="bg-neutral-50/50 rounded-2xl border border-neutral-100 px-4 py-2">
            {DAY_KEYS.map(day => (
              <DayRow
                key={day}
                dayKey={day}
                schedule={openingHours[day]}
                onChange={updateDaySchedule}
              />
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <SaveButton onClick={saveOpeningHours} saving={saving === 'hours'} />
          </div>
        </SectionCard>

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </AdminLayout>
  );
}
