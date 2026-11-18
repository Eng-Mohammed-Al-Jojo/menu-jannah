import { useState, useEffect } from "react";
import { FiX, FiStar, FiMessageSquare, FiSend } from "react-icons/fi";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    show: boolean;
    onClose: () => void;
    orderSystem?: boolean;
}

const LOCAL_STORAGE_KEY = "feedbackSettings";

export default function FeedbackModal({ show, onClose }: Props) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [feedbackPhone, setFeedbackPhone] = useState("");

    useEffect(() => {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            const data = JSON.parse(localData);
            if (data.feedbackPhone) setFeedbackPhone(data.feedbackPhone);
        }

        const feedbackRef = ref(db, "settings/complaintsWhatsapp");
        const unsubscribe = onValue(feedbackRef, (snapshot) => {
            if (snapshot.exists()) {
                const phone = snapshot.val();
                setFeedbackPhone(phone);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ feedbackPhone: phone }));
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!show) {
            setName("");
            setPhone("");
            setMessage("");
            setRating(0);
            setHoverRating(0);
        }
    }, [show]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleSend = () => {
        if (!message.trim()) {
            showToast("يرجى كتابة رسالتك أولاً");
            return;
        }
        if (!feedbackPhone) {
            showToast("خدمة التقييم غير متوفرة حالياً");
            return;
        }

        const fullMessage = `تقييم المطعم\n------------------\nالاسم: ${name || "-"}\nالهاتف: ${phone || "-"}\nالتقييم: ${rating}/5\nالملاحظة: ${message || "-"}`;
        const url = `https://wa.me/${feedbackPhone}?text=${encodeURIComponent(fullMessage)}`;
        window.open(url, "_blank");

        showToast("شكراً على تقييمك!");
        onClose();
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 16 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-sm rounded-3xl bg-[var(--brand-cream)] shadow-[0_24px_64px_rgba(11,59,45,0.18)] border border-amber-500/20 overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-amber-500/08">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ background: "var(--amber-a08)", color: "var(--brand-amber)" }}
                                >
                                    <FiMessageSquare size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900">تقييمك يهمنا</h2>
                                    <p className="text-xs text-neutral-400 mt-0.5">شاركنا رأيك لتحسين تجربتك</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-all"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            {/* Name */}
                            <input
                                type="text"
                                placeholder="الاسم (اختياري)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] text-neutral-900 border border-amber-500/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all text-sm font-medium placeholder:text-neutral-400"
                            />

                            {/* Phone */}
                            <input
                                type="tel"
                                placeholder="رقم الهاتف (اختياري)"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                dir="ltr"
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] text-neutral-900 border border-amber-500/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all text-sm font-medium placeholder:text-neutral-400 text-right"
                            />

                            {/* Stars Rating */}
                            <div className="flex justify-center gap-1.5 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <FiStar
                                            size={28}
                                            className={`transition-all duration-200 ${
                                                star <= (hoverRating || rating)
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-neutral-300"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Message */}
                            <textarea
                                placeholder="اكتب ملاحظتك أو اقتراحك..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] text-neutral-900 border border-amber-500/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all text-sm font-medium resize-none h-28 placeholder:text-neutral-400"
                            />

                            {/* Submit */}
                            <button
                                onClick={handleSend}
                                className="w-full py-3.5 rounded-xl bg-snouno-dark text-amber-400 font-bold text-sm flex items-center justify-center gap-2 border border-amber-500/25 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 active:scale-98"
                            >
                                <FiSend size={15} />
                                إرسال التقييم
                            </button>
                        </div>
                    </motion.div>

                    {/* Toast */}
                    <AnimatePresence>
                        {toastMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, x: "-50%" }}
                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                exit={{ opacity: 0, y: 20, x: "-50%" }}
                                className="fixed bottom-8 left-1/2 z-[300] bg-snouno-dark text-amber-400 px-6 py-3 rounded-full font-bold text-sm shadow-xl border border-amber-500/25"
                            >
                                {toastMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
