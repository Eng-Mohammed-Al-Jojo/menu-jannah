import { useMemo } from "react";
import ItemRow from "./ItemRow";
import type { Category, Item, Subcategory } from "./Menu";
import { motion } from "framer-motion";

interface Props {
  category: Category;
  subcategories: Subcategory[];
  items: Item[];
  orderSystem: boolean;
  onItemClick?: (item: Item) => void;
  onDetailsClick?: (item: Item) => void;
}

const revealVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function CategorySection({
  category,
  subcategories,
  items,
  orderSystem,
  onItemClick,
  onDetailsClick,
}: Props) {
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {};
    const noSubItems: Item[] = [];

    items.forEach((item) => {
      const sub = subcategories.find((s) => s.id === item.subcategoryId);
      if (item.subcategoryId && sub && sub.visible !== false) {
        if (!groups[item.subcategoryId]) groups[item.subcategoryId] = [];
        groups[item.subcategoryId].push(item);
      } else {
        noSubItems.push(item);
      }
    });

    return { groups, noSubItems };
  }, [items, subcategories]);

  const activeSubcategories = useMemo(() => {
    return subcategories
      .filter(
        (sub) =>
          sub.categoryId === category.id &&
          sub.visible !== false &&
          groupedItems.groups[sub.id]
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [category.id, subcategories, groupedItems.groups]);

  const catName = category.nameAr || category.name || "";

  return (
    <motion.div
      id={`menu-category-${category.id}`}
      data-menu-category={category.id}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="w-full flex flex-col gap-3 sm:gap-5 transform-gpu"
    >
      {/* ── Category Header ── */}
      <div className="flex items-center gap-2 px-1">
        {/* Amber accent dot */}
        <span
          className="shrink-0 w-2 h-2 rounded-full bg-amber-500"
          aria-hidden="true"
        />

        <h2
          className="font-bold leading-tight text-right"
          style={{
            fontSize: "clamp(20px, 5vw, 26px)",
            color: "var(--brand-amber)",
          }}
        >
          {catName}
        </h2>

        {/* Decorative trailing line */}
        <div
          className="flex-1 h-px rounded-full opacity-30"
          style={{ background: "linear-gradient(to left, var(--brand-amber), transparent)" }}
          aria-hidden="true"
        />
      </div>

      {/* ── Vertical Product List ── */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Main items (no subcategory) */}
        {groupedItems.noSubItems.length > 0 && (
            <div className="flex flex-col gap-2">
            {groupedItems.noSubItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                orderSystem={orderSystem}
                onClick={onItemClick}
                onDetailsClick={onDetailsClick}
              />
            ))}
          </div>
        )}

        {/* Subcategories */}
        {activeSubcategories.map((sub) => (
          <div key={sub.id} className="flex flex-col gap-2 sm:gap-3">
            {/* Subcategory label */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-px rounded-full"
                style={{ background: "var(--border-base)" }}
                aria-hidden="true"
              />
              <span
                className="font-semibold whitespace-nowrap shrink-0 text-[11px] px-3 py-1 rounded-full"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--brand-amber)",
                  border: "1px solid var(--border-base)",
                  letterSpacing: "0.03em",
                }}
              >
                {sub.nameAr}
              </span>
              <div
                className="flex-1 h-px rounded-full"
                style={{ background: "var(--border-base)" }}
                aria-hidden="true"
              />
            </div>

            {/* Sub-items vertical list */}
            <div className="flex flex-col gap-2">
              {groupedItems.groups[sub.id].map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  orderSystem={orderSystem}
                  onClick={onItemClick}
                  onDetailsClick={onDetailsClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
