import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Category } from "./Menu";
import { LayoutGrid } from "lucide-react";

interface Props {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryNavigation({ categories, activeId, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeId]);

  return (
    <div className="sticky top-0 z-40 -mx-3 px-3 py-3 bg-[var(--bg-main)] sm:mx-0 sm:px-0">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max px-1">
          {/* "الكل" pill */}
          <Pill
            id="all"
            label="الكل"
            isActive={activeId === "all" || !activeId}
            onClick={() => onSelect("all")}
            isAll
            refProp={(activeId === "all" || !activeId) ? activeRef : null}
          />

          {categories.map((cat) => (
            <Pill
              key={cat.id}
              id={cat.id}
              label={cat.nameAr || cat.name}
              isActive={activeId === cat.id}
              onClick={() => onSelect(cat.id)}
              refProp={activeId === cat.id ? activeRef : null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PillProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isAll?: boolean;
  refProp?: React.Ref<HTMLButtonElement> | null;
}

function Pill({ label, isActive, onClick, isAll, refProp }: PillProps) {
  return (
    <button
      ref={refProp || null}
      onClick={onClick}
      aria-pressed={isActive}
      className={`relative flex items-center gap-2 whitespace-nowrap font-bold text-sm sm:text-base px-5 py-2.5 rounded-full transition-all duration-200 outline-none select-none cursor-pointer ${
        isActive
          ? "text-white shadow-[0_4px_16px_rgba(18,19,22,0.20)]"
          : "text-neutral-600 bg-white/80 border border-amber-500/12 hover:border-amber-500/35 hover:text-amber-700 shadow-sm"
      }`}
    >
      {/* Active background slider */}
      {isActive && (
        <motion.div
          layoutId="activeCategoryPill"
          className="absolute inset-0 rounded-full bg-snouno-dark border border-amber-500/35"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-1.5">
        {isAll ? (
          <LayoutGrid size={13} className={isActive ? "text-amber-400" : "text-neutral-400"} />
        ) : (
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isActive ? "bg-amber-400" : "bg-amber-400/35"
            }`}
          />
        )}
        {label}
      </span>
    </button>
  );
}
