import { useState, useEffect, useCallback } from "react";
import CartButton from "../components/cart/CartButton";
import Footer from "../components/menu/footer";
import Menu, { type Item } from "../components/menu/Menu";
import ItemModal from "../components/menu/ItemModal";
import ItemDetailsDrawer from "../components/menu/ItemDetailsDrawer";
import PromotionsSection from "../components/menu/PromotionsSection";
import LoadingScreen from "../components/common/LoadingScreen";
import { motion } from "framer-motion";
import { FirebaseService } from "../services/firebaseService";
import OrderStatusButton from "../components/cart/OrderStatusButton";
import FeaturedStrip from "../components/menu/FeaturedStrip";
import { PromotionService } from "../services/promotionService";
import { DEFAULT_OPENING_HOURS, isRestaurantOpen, type OpeningHours } from "../types/promotion";
import { ORDER_SYSTEM_ENABLED } from "../config/orderSystem";

export default function MenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isPromotionsReady, setIsPromotionsReady] = useState(false);
  const [hasFeatured, setHasFeatured] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<Item | null>(null);
  const [orderSystem, setOrderSystem] = useState(ORDER_SYSTEM_ENABLED);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);
  const [isOpenNow, setIsOpenNow] = useState(() => isRestaurantOpen(DEFAULT_OPENING_HOURS));

  useEffect(() => {
    const unsubscribe = FirebaseService.listen("settings/orderSystem", (value) => {
      setOrderSystem(ORDER_SYSTEM_ENABLED && Boolean(value));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = PromotionService.subscribeOpeningHours((hours) => {
      setOpeningHours(hours);
      setIsOpenNow(isRestaurantOpen(hours));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const refreshStatus = window.setInterval(() => {
      setIsOpenNow(isRestaurantOpen(openingHours));
    }, 60000);

    return () => {
      window.clearInterval(refreshStatus);
    };
  }, [openingHours]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handlePromotionsReady = useCallback(() => {
    setIsPromotionsReady(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isPromotionsReady) setIsDataReady(true);
  }, [isLoading, isPromotionsReady]);

  const handleFeaturedCheck = useCallback((has: boolean) => {
    setHasFeatured(has);
  }, []);

  const handleFeaturedItemsChange = useCallback((items: Item[]) => {
    setFeaturedItems(items);
  }, []);

  const handleItemClick = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  const handleDetailsClick = useCallback((item: Item) => {
    setSelectedDetailsItem(item);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col menu-wrapper overflow-x-clip"
      style={{ background: "var(--bg-main)", color: "var(--text-primary)" }}
      dir="rtl"
    >
      {/* Loading Screen */}
      <LoadingScreen visible={isLoading || !isPromotionsReady} />

      <main className="flex flex-col flex-1">
        {/* ═══════════════════════════════════════
            JANNAH BRAND HERO — Deep Green & Toasted Gold
            ═══════════════════════════════════════ */}
        <section
          className="relative flex flex-col justify-center overflow-hidden bg-[var(--bg-hero)] pt-8 pb-0 min-h-[20rem] sm:min-h-[24rem]"
          aria-label="قسم الترحيب"
        >
          {/* Restaurant photograph + readable brand overlay */}
          <div className="absolute inset-0 bg-[url('/jannah-restaurant.jpg')] bg-cover bg-center" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,59,45,.9),rgba(11,59,45,.62),rgba(11,59,45,.84))]" aria-hidden="true" />

          {/* Radial Ambient Amber Glow */}
          <motion.div
            initial={{ opacity: 0.28 }}
            animate={{ opacity: 0.28 }}
            className="absolute top-1/2 right-[12%] -translate-y-1/2 w-[360px] h-[360px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(216,192,133,0.28) 0%, transparent 68%)",
            }}
          />

          {/* Logo Badge Showcase */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex w-full max-w-6xl mx-auto flex-row-reverse items-center justify-between gap-6 px-6 sm:px-10"
          >
            <div className="relative flex shrink-0 items-center justify-center w-24 h-24 sm:w-32 sm:h-32">
              {/* Outer Amber Halo Ring */}
              <div className="absolute inset-0 rounded-[2rem] pointer-events-none border border-amber-500/35" />

              {/* Inner Glow Aura */}
              <div className="absolute inset-2 rounded-2xl bg-amber-500/10 blur-md pointer-events-none" />

              {/* Main Brand Logo Image */}
              <motion.img
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.15, ease: "backOut" }}
                className="relative z-10 object-cover w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-2 border-amber-500/35 shadow-[0_12px_32px_rgba(0,0,0,.24)]"
                src="/jannah-logo.jpg"
                alt="شعار مطعم جنة"
              />
            </div>

            {/* Brand Title & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55 }}
              className="mt-0 flex flex-1 items-start text-right flex-col gap-1 z-10"
            >


              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight text-white tracking-tight">
                جنة .. اليوم وكل يوم
              </h1>

              <p className="text-xs sm:text-sm text-amber-100/70 font-medium mt-1 max-w-sm">
                اختياراتنا المميزة بإنتظارك
              </p>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${isOpenNow
                  ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                  : "border-white/20 bg-black/15 text-white/75"
                  }`}
                aria-live="polite"
              >
                <span className={`h-2 w-2 rounded-full ${isOpenNow ? "bg-emerald-300" : "bg-white/45"}`} />
                {isOpenNow ? "مفتوح الآن" : "مغلق حاليًا"}
              </div>
            </motion.div>
          </motion.div>

          {/* Soft, seamless transition into the menu canvas */}
          <div
            className="absolute bottom-[-1px] left-1/2 z-10 h-10 w-[115%] -translate-x-1/2 translate-y-1/2 rounded-[50%_50%_0_0/100%_100%_0_0] bg-[var(--bg-main)] sm:h-14"
            aria-hidden="true"
          />
        </section>

        {/* ═══════════════════════════
            MENU CONTENT — Warm Cream Canvas
            ═══════════════════════════ */}
        <div className="relative z-20 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pb-28 pt-2 sm:pt-3">
          {/* Promotions Section */}
          <PromotionsSection onReady={handlePromotionsReady} />
          {isDataReady && hasFeatured && (
            <FeaturedStrip
              items={featuredItems}
              orderSystem={orderSystem}
              onItemClick={handleItemClick}
              onDetailsClick={handleDetailsClick}
            />
          )}
          <Menu
            onLoadingChange={handleLoadingChange}
            onFeaturedCheck={handleFeaturedCheck}
            onFeaturedItemsChange={handleFeaturedItemsChange}
            onItemClick={handleItemClick}
            onDetailsClick={handleDetailsClick}
          />
        </div>
      </main>

      {/* Floating Cart Button */}
      {isDataReady && (
        <div className="fixed bottom-6 left-6 z-50">
          <CartButton />
        </div>
      )}

      {/* Item details and order modals */}
      <ItemModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />

      <ItemDetailsDrawer
        isOpen={!!selectedDetailsItem}
        onClose={() => setSelectedDetailsItem(null)}
        item={selectedDetailsItem}
        orderSystem={orderSystem}
      />

      <OrderStatusButton />
      <Footer />
    </div>
  );
}
