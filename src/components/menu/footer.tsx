import {
  FaLaptopCode,
  FaMapMarkerAlt,
  FaInstagram,
  FaWhatsapp,
  FaFacebookF,
  FaPhoneAlt,
  FaTelegramPlane,
  FaTiktok,
} from "react-icons/fa";
import { FiCreditCard, FiClock, FiExternalLink } from "react-icons/fi";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { PaymentService } from "../../services/paymentService";
import type { PaymentMethod } from "../../types/payment";
import PaymentModal from "./PaymentModal";
import { PromotionService } from "../../services/promotionService";
import {
  type OpeningHours,
  DAY_LABELS,
  DAY_KEYS,
  DEFAULT_OPENING_HOURS,
  isRestaurantOpen,
} from "../../types/promotion";

const LOCAL_STORAGE_KEY = "footerInfo";

function formatTime12(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "مساءً" : "صباحًا";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.padStart(2, "0")} ${period}`;
}

export default function Footer() {
  const [footer, setFooter] = useState({
    address: "",
    phone: "",
    whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    telegram: "",
  });

  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isPaymentLoading, setIsPaymentLoading] = useState(true);

  useEffect(() => {
    const unsubPayments = PaymentService.subscribeToPaymentMethods((methods) => {
      setPaymentMethods(methods);
      setIsPaymentLoading(false);
    });
    return () => unsubPayments();
  }, []);

  useEffect(() => {
    const unsubHours = PromotionService.subscribeOpeningHours((hours) => {
      setOpeningHours(hours);
      setIsOpenNow(isRestaurantOpen(hours));
    });
    return () => unsubHours();
  }, []);

  useEffect(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) setFooter(JSON.parse(localData));

    const footerRef = ref(db, "settings/footerInfo");
    const unsubFooter = onValue(footerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFooter(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    });

    return () => {
      unsubFooter();
    };
  }, []);

  const socialLinks: { Icon: any; url: string | undefined; label: string }[] = [
    {
      Icon: FaWhatsapp,
      url: footer.whatsapp ? `https://wa.me/${footer.whatsapp}` : undefined,
      label: "واتساب",
    },
    { Icon: FaInstagram, url: footer.instagram || undefined, label: "إنستغرام" },
    { Icon: FaFacebookF, url: footer.facebook || undefined, label: "فيسبوك" },
    { Icon: FaTiktok, url: footer.tiktok || undefined, label: "تيك توك" },
    { Icon: FaTelegramPlane, url: footer.telegram || undefined, label: "تيليغرام" },
  ];

  const activeSocialLinks = socialLinks.filter((s) => s.url);

  return (
    <footer
      className="relative w-full overflow-hidden bg-[var(--brand-obsidian)] text-white mt-12"
      aria-label="تذييل الصفحة"
      dir="rtl"
    >
      {/* Jannah pattern — subtle brand texture */}
      <div
        className="absolute inset-0 pointer-events-none bg-[url('/jannah-pattern.jpg')] bg-cover bg-center opacity-[0.08] mix-blend-screen"
        aria-hidden="true"
      />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(11,59,45,.96),rgba(11,59,45,.82))]" aria-hidden="true" />

      {/* Wave transition from cream to dark */}
      <div
        className="relative w-full pointer-events-none h-12 overflow-hidden rotate-180"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="block w-full h-full"
        >
          <path d="M0,20 C480,55 960,0 1440,30 L1440,60 L0,60 Z" fill="var(--bg-main)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pb-10 pt-2 flex flex-col items-center gap-5 text-center">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/jannah-logo.jpg"
            alt="جنة"
            className="w-16 h-16 object-cover rounded-2xl border-2 border-amber-500/35 shadow-[0_10px_26px_rgba(0,0,0,.25)]"
          />

        </div>

        {/* Contact info */}
        {(footer.address || footer.phone) && (
          <div className="flex flex-wrap justify-center items-center gap-2.5 text-xs text-neutral-400">
            {footer.address && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/15 bg-white/[0.045] px-3 py-2 text-right">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <FaMapMarkerAlt size={12} />
                </span>
                <span className="font-semibold text-neutral-300">{footer.address}</span>
              </div>
            )}
            {footer.phone && (
              <a
                href={`tel:${footer.phone}`}
                className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
              >
                <FaPhoneAlt className="text-amber-500 shrink-0" size={11} />
                <span dir="ltr">{footer.phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Dynamic Status Indicator & Opening Hours */}
        <div className="w-full max-w-sm bg-white/5 border border-amber-500/15 rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full border-b border-amber-500/10 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
              <FiClock className="text-amber-500" size={14} />
              <span>ساعات العمل</span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${isOpenNow
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                  }`}
              />
              <span>{isOpenNow ? "مفتوح الآن" : "مغلق الآن"}</span>
            </div>
          </div>

          <div className="w-full space-y-1.5 text-xs">
            {DAY_KEYS.map((dayKey) => {
              const sched = openingHours[dayKey];
              if (!sched?.enabled) return null;
              return (
                <div key={dayKey} className="flex justify-between items-center text-neutral-300">
                  <span className="font-semibold text-neutral-400">{DAY_LABELS[dayKey]}</span>
                  <span className="font-bold text-amber-400/90" dir="rtl">
                    {formatTime12(sched.open)} — {formatTime12(sched.close)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center gap-2 bg-white/8 border border-amber-500/25 px-4 py-2 rounded-full text-amber-400 font-semibold text-xs hover:bg-white/15 hover:border-amber-500/40 transition-all"
        >
          <FiCreditCard size={13} />
          <span>طرق الدفع</span>
        </button>

        {/* Divider */}
        <div className="w-24 h-px bg-amber-500/15" />

        {/* Social Icons */}
        {activeSocialLinks.length > 0 && (
          <div className="flex gap-2">
            {activeSocialLinks.map(({ Icon, url, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-amber-500/20 text-amber-400/70 hover:bg-amber-500 hover:text-snouno-dark hover:border-amber-500 transition-all duration-200"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        )}

        {/* Signature */}
        <div className="pt-4 border-t border-amber-500/12 w-full flex flex-col items-center gap-2">
          <a
            href="https://engmohammedaljojo.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="زيارة موقع المهندس محمد الجوجو"
            className="group flex w-full max-w-[260px] flex-col items-center gap-1.5 rounded-xl border border-amber-500/18 bg-white/[0.035] px-4 py-2.5 transition-all hover:border-amber-400/50 hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300/85">
              <FaLaptopCode size={12} />
              <span>تطوير وتصميم</span>
            </div>
            <span className="text-[13px] font-black tracking-wide text-amber-300 group-hover:text-amber-200 transition-colors">
              Eng. Mohammed El joujo
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] font-bold text-amber-200/90 transition-colors group-hover:bg-amber-500/20">
              <FiExternalLink size={11} />
              زيارة الموقع
            </span>
          </a>
          <p className="text-[10px] text-neutral-500 mt-1">
            © {new Date().getFullYear()} Jannah. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        methods={paymentMethods}
        isLoading={isPaymentLoading}
      />
    </footer>
  );
}
