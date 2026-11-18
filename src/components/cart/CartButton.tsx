import { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import CartModal from "./CartModal";
import { motion, AnimatePresence } from "framer-motion";

interface CartButtonProps {
  className?: string;
}

export default function CartButton({ className = "" }: CartButtonProps) {
  const { totalItems, isFullTrackingOpen, setIsFullTrackingOpen } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isFullTrackingOpen) {
      setOpen(true);
    }
  }, [isFullTrackingOpen]);

  const handleCloseModal = () => {
    setOpen(false);
    if (isFullTrackingOpen) {
      setIsFullTrackingOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            initial={{ scale: 0.85, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 15 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            aria-label="السلة"
            className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 h-13 rounded-full bg-snouno-dark text-amber-400 font-extrabold shadow-[0_12px_32px_rgba(18,19,22,0.4)] border border-amber-500/40 text-sm tracking-wide cursor-pointer backdrop-blur-md ${className}`}
          >
            {/* Shopping Bag Icon */}
            <div className="relative flex items-center justify-center">
              <ShoppingBag size={20} className="text-amber-400" />
              {/* Badge */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  className="absolute -top-2.5 -end-2.5 w-5 h-5 rounded-full bg-amber-500 text-snouno-dark text-[10px] font-black flex items-center justify-center border-2 border-snouno-dark shadow-sm"
                >
                  {totalItems}
                </motion.span>
              </AnimatePresence>
            </div>

            <span>السلة</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal Drawer */}
      <AnimatePresence>
        {open && <CartModal isOpen={open} onClose={handleCloseModal} />}
      </AnimatePresence>
    </>
  );
}
