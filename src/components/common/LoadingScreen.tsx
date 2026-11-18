import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  onExited?: () => void;
}

export default function LoadingScreen({ visible, onExited }: Props) {
  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible && (
        <motion.div
          key="jannah-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-hero)] select-none"
          dir="rtl"
        >
          {/* Jannah restaurant atmosphere */}
          <div className="absolute inset-0 bg-[url('/jannah-restaurant.jpg')] bg-cover bg-center" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(11,59,45,.92),rgba(11,59,45,.68),rgba(11,59,45,.9))]" aria-hidden="true" />

          {/* Cinematic Radial Gold Vignette Glow */}
          <div className="absolute w-[420px] h-[420px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(188,157,107,.18),transparent_70%)]" />

          {/* Central Branded Composition */}
          <div className="relative z-10 flex h-full w-full max-w-sm translate-y-[22vh] flex-col items-center justify-center gap-12 px-6 py-[15vh] text-center sm:translate-y-[18vh]">

            {/* Loading Character Spotlight Badge */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center will-change-transform"
            >
              <motion.div
                animate={{ y: [0, -5, 0], scale: [1, 1.018, 1] }}
                transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity }}
                className="flex items-center justify-center"
              >
              {/* Subtle Ambient Gold Ring Ring Halo */}
              <div className="absolute w-36 h-36 rounded-[1.5rem] pointer-events-none border border-amber-500/35" />

              {/* Inner Soft Glow Frame */}
              <div className="relative w-28 h-28 rounded-[1.25rem] overflow-hidden border-2 border-amber-500/35 bg-black/20 shadow-[0_12px_32px_rgba(0,0,0,.28)]">
                <img
                  src="/jannah-logo.jpg"
                  alt="شعار جنة"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gold Emblem Accent Tag at bottom of circle */}
              </motion.div>
            </motion.div>

            {/* Typography & Sophisticated Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="flex flex-col items-center gap-4"
            >
              <h2 className="text-lg font-bold text-white tracking-wide">
                جنة .. اليوم وكل يوم
              </h2>

              <p className="text-xs text-amber-200/60 tracking-widest uppercase font-medium">
                جاري تجهيز المنيو...
              </p>

              {/* Minimal Line Progress Bar */}
              <div className="relative mt-1 h-2 w-44 overflow-hidden rounded-full border border-amber-300/20 bg-[rgba(239,230,201,.16)] p-[2px] shadow-[0_0_18px_rgba(188,157,107,.14)]">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.6, ease: "easeInOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--brand-amber-deep)] via-[var(--brand-beige)] to-[var(--brand-amber)] shadow-[0_0_10px_rgba(216,192,133,.72)]"
                />
              </div>
            </motion.div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
