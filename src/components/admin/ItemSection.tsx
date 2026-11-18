import React, { useState, useEffect } from "react";
import { ref, push, update } from "firebase/database";
import { db } from "../../firebase";
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiChevronDown, FiStar, FiImage, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { normalizeIngredients } from "../../utils/stringUtils";
import type { PopupState, Category, Item, Subcategory } from "./types";
import FeaturedGallery from "./FeaturedGallery";
import CustomSelect from "./CustomSelect";


interface Props {
  categories: Record<string, Category>;
  subcategories: Record<string, Subcategory>;
  items: Record<string, Item>;
  popup: PopupState;
  setPopup: (popup: PopupState) => void;
}

const SortableItem: React.FC<{
  item: Item & { id: string };
  idx: number;
  totalItems: number;
  subcategories: Record<string, Subcategory>;
  toggleItem: (id: string, visible: boolean) => void;
  openGallery: (itemId: string, currentImage?: string) => void;
  removeImage: (id: string) => void;
  setPopup: (popup: PopupState) => void;
  moveItem: (categoryId: string, itemId: string, direction: 'up' | 'down') => void;
}> = ({ item, idx, totalItems, subcategories, toggleItem, openGallery, removeImage, setPopup, moveItem }) => {
  const { setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`flex flex-col sm:flex-row gap-2 sm:gap-2 py-2 transition-all bg-white mb-1.5 px-1.5 sm:px-2 rounded-xl border ${isDragging ? "z-50 shadow-premium border-primary scale-[1.02]" : "border-gray-50 hover:border-primary/20 shadow-soft hover:shadow-premium"} ${!item.visible ? "opacity-40 grayscale" : ""
        }`}
    >
      {/* ===== Top Row (image + info) ===== */}
      <div className="flex gap-2.5 w-full items-center">
        {/* Image */}
        <div className="relative group/img shrink-0">
          {item.image ? (
            <>
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                <img
                  src={item.image.startsWith('http') || item.image.startsWith('/') ? item.image : `/images/${item.image}`}
                  alt={item.nameAr || item.name}
                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                  onError={(e) => { e.currentTarget.src = "/jannah-logo.jpg" }}
                />
              </div>

              <button
                onClick={() => removeImage(item.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg scale-100 lg:scale-0 lg:group-hover/img:scale-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-95 z-10"
                title="حذف الصورة"
              >
                <FiTrash2 size={12} />
              </button>
            </>
          ) : (
            <button
              onClick={() => openGallery(item.id)}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/40 transition-all"
            >
              <FiImage size={24} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col">

          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[15px] sm:text-lg text-gray-900 truncate">
              {item.nameAr || item.name}
            </h4>

            {item.star && (
              <FiStar
                className="text-amber-400 fill-amber-400 shrink-0"
                size={16}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-1">
            {item.subcategoryId && (
              <span className="text-[9px] px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-md font-bold text-primary uppercase tracking-wider">
                {subcategories[item.subcategoryId]?.nameAr || subcategories[item.subcategoryId]?.name}
              </span>
            )}
            {item.ingredientsAr && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(item.ingredientsAr || item.ingredients || '').split(',').map((ing, i) => (
                  <span key={i} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200">
                    {ing.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm font-black text-primary">{item.price}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">₪</span>
          </div>

        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-inner">

        {/* Animated Toggle */}
        <button
          onClick={() => toggleItem(item.id, item.visible)}
          className={`relative shrink-0 w-9 h-5 rounded-full flex items-center p-0.5 transition-all duration-500 ${item.visible
            ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            : "bg-gray-300"
            }`}
          style={{
            justifyContent: item.visible ? "flex-end" : "flex-start"
          }}
        >
          <motion.div
            layout
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white shadow-sm z-10"
          />
        </button>

        <div className="flex items-center gap-1.5">

          <button
            onClick={async () => {
              const newStar = !item.star;
              await update(ref(db, `items/${item.id}`), { star: newStar });
            }}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${item.star
              ? "bg-amber-100 text-amber-600"
              : "hover:bg-white text-gray-400 hover:text-amber-500 hover:shadow-sm"
              }`}
          >
            <FiStar size={18} fill={item.star ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => setPopup({ type: "editItem", id: item.id })}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all"
          >
            <FiEdit size={18} />
          </button>

          <button
            onClick={() => setPopup({ type: "deleteItem", id: item.id })}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-secondary hover:shadow-sm text-gray-400 transition-all"
          >
            <FiTrash2 size={18} />
          </button>

        </div>
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => moveItem(item.categoryId, item.id, 'up')}
            disabled={idx === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <FiArrowUp size={18} />
          </button>
          <button
            onClick={() => moveItem(item.categoryId, item.id, 'down')}
            disabled={idx === totalItems - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary hover:shadow-sm text-gray-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <FiArrowDown size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ItemSection: React.FC<Props> = ({ categories, subcategories, items, setPopup }) => {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [itemNameAr, setItemNameAr] = useState("");
  const [itemIngredientsAr, setItemIngredientsAr] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [quickSearch, setQuickSearch] = useState("");

  const [selectedCategoryError, setSelectedCategoryError] = useState(false);
  const [itemNameError, setItemNameError] = useState(false);
  const [itemPriceError, setItemPriceError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [showGallery, setShowGallery] = useState(false);
  const [galleryForItemId, setGalleryForItemId] = useState<string | null>(null);
  const [itemImage, setItemImage] = useState("");
  const [localItems, setLocalItems] = useState<Record<string, Item>>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const addItem = async () => {
    let hasError = false;
    if (!selectedCategory) { setSelectedCategoryError(true); hasError = true; }
    if (!itemNameAr.trim()) { setItemNameError(true); hasError = true; }

    const priceArray = itemPrice.split(",").map(p => p.trim());
    if (!itemPrice.trim() || priceArray.some(p => isNaN(Number(p)) || Number(p) <= 0)) {
      setItemPriceError(true);
      hasError = true;
    }

    if (hasError) return;

    await push(ref(db, "items"), {
      nameAr: itemNameAr,
      ingredientsAr: normalizeIngredients(itemIngredientsAr),
      price: itemPrice,
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory || null,
      visible: true,
      createdAt: Date.now(),
      image: itemImage || "",
      star: false,
    });

    setItemNameAr("");
    setItemIngredientsAr("");
    setItemPrice("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setItemImage("");
    setShowAddModal(false);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const toggleItem = async (id: string, visible: boolean) => {
    await update(ref(db, `items/${id}`), { visible: !visible });
  };

  const updateImage = async (id: string, image: string) => {
    await update(ref(db, `items/${id}`), { image });
  };

  const removeImage = async (id: string) => {
    await update(ref(db, `items/${id}`), { image: "" });
  };

  const openGallery = (itemId: string, currentImage?: string) => {
    setGalleryForItemId(itemId);
    setItemImage(currentImage || "");
    setShowGallery(true);
  };

  const handleSelectImage = async (img: string) => {
    if (galleryForItemId === "new_item") {
      setItemImage(img);
      setShowGallery(false);
      return;
    }
    if (!galleryForItemId) return;
    await updateImage(galleryForItemId, img);
    setShowGallery(false);
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moveItem = async (categoryId: string, itemId: string, direction: 'up' | 'down') => {
    const catItems = Object.entries(localItems)
      .map(([id, item]) => ({ ...item, id }))
      .filter(item => item.categoryId === categoryId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const index = catItems.findIndex(i => i.id === itemId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= catItems.length) return;

    const newItems = [...catItems];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, movedItem);

    // Update orders in Firebase
    const updates: Record<string, any> = {};
    newItems.forEach((item, idx) => {
      updates[`items/${item.id}/order`] = idx;
    });

    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Failed to reorder items:", err);
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handleDragEndItems = async (event: DragEndEvent, currentItems: (Item & { id: string })[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = currentItems.findIndex((i) => i.id === active.id);
    const newIndex = currentItems.findIndex((i) => i.id === over.id);

    const newArray = arrayMove(currentItems, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newArray.forEach((item, index) => {
      updates[`items/${item.id}/order`] = index;
    });

    try {
      await update(ref(db), updates);
    } catch (err) {
      console.error("Failed to drag reorder items:", err);
    }
  };

  const currentCatSubcategories = Object.entries(subcategories)
    .filter(([, sub]) => sub.categoryId === selectedCategory)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-4">


      {/* Add item trigger */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-black text-neutral-900">الأصناف</h2>
          <p className="text-xs text-neutral-400 mt-1">إدارة الأصناف وترتيبها حسب الأقسام</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-obsidian)] px-4 py-2.5 text-xs font-black text-amber-300 shadow-sm hover:bg-[var(--brand-obsidian-light)] transition-colors"
        >
          <FiPlus size={16} /> إضافة صنف جديد
        </button>
      </div>

      {/* Add item modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(11,59,45,.62)] p-3 sm:p-6 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }}
              className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-[var(--bg-surface)] p-3 sm:p-4 shadow-2xl"
            >
              <button type="button" onClick={() => setShowAddModal(false)} className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-sm text-neutral-500 hover:bg-neutral-200" aria-label="إغلاق">×</button>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-sm text-amber-700"><FiPlus /></div>
                <div><h2 className="text-base font-black text-neutral-900">{t('admin.add_new_item')}</h2><p className="text-[11px] text-neutral-400">أدخل بيانات الصنف ثم احفظه</p></div>
              </div>

              <div className="bg-transparent relative overflow-hidden group">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 px-1">{t('admin.categories')}</label>
                    <CustomSelect
                      options={Object.keys(categories).map(id => ({ id, name: categories[id].nameAr || "" }))}
                      value={selectedCategory}
                      onChange={(val) => { setSelectedCategory(val); setSelectedSubcategory(""); setSelectedCategoryError(false); }}
                      error={selectedCategoryError}
                      placeholder={t('admin.select_category')}
                    />
                  </div>

                  <div className={`flex flex-col gap-1.5 transition-all duration-500 ${currentCatSubcategories.length > 0 ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-2"}`}>
                    <label className="text-xs font-bold text-gray-500 px-1">{t('admin.subcategories')}</label>
                    <CustomSelect
                      options={currentCatSubcategories.map(([id, sub]) => ({ id, name: sub.nameAr || "" }))}
                      value={selectedSubcategory}
                      onChange={(val) => setSelectedSubcategory(val)}
                      placeholder={t('admin.select_subcategory')}
                      disabled={currentCatSubcategories.length === 0}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 px-1">
                      {t('common.name')}
                    </label>
                    <input
                      className={`w-full h-10 bg-gray-50 border px-3 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all
                ${itemNameError ? "border-secondary" : "border-gray-100"} text-right`}
                      placeholder={t('admin.item_name_ar_placeholder')}
                      value={itemNameAr}
                      onChange={(e) => {
                        setItemNameAr(e.target.value);
                        setItemNameError(false);
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 px-1">
                      {t('admin.ingredients_label')}
                    </label>
                    <input
                      className="w-full h-10 bg-gray-50 border border-gray-100 px-3 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-right"
                      placeholder={t('admin.ingredients_placeholder')}
                      value={itemIngredientsAr}
                      onChange={(e) => setItemIngredientsAr(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 px-1">{t('common.total')}</label>
                    <input
                      className={`w-full h-10 bg-gray-50 border px-3 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all
                ${itemPriceError ? "border-secondary" : "border-gray-100"}`}
                      placeholder={t('admin.item_price_placeholder')}
                      value={itemPrice}
                      onChange={(e) => { setItemPrice(e.target.value); setItemPriceError(false); }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest px-1">
                      صورة المنتج
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2.5 rounded-xl bg-white border border-neutral-200">
                      {itemImage ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0 shadow-sm">
                          <img
                            src={itemImage.startsWith('http') || itemImage.startsWith('/') ? itemImage : `/images/${itemImage}`}
                            alt="معاينة"
                            className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/jannah-logo.jpg'; }}
                          />
                          <button
                            type="button"
                            onClick={() => setItemImage("")}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 cursor-pointer"
                            title="حذف الصورة"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ) : (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                  <img src="/jannah-logo.jpg" alt="الصورة الافتراضية" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-right sm:text-right w-full">
                        <p className="text-xs font-bold text-neutral-800 truncate" dir="ltr">
                          {itemImage ? itemImage : "لم يتم اختيار صورة للمنتج"}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          انقر على الزر لاختيار صورة ممتازة للمنتج من معرض الصور حصراً.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setGalleryForItemId("new_item"); setShowGallery(true); }}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg bg-amber-500 text-snouno-dark font-black text-[11px] hover:bg-amber-400 transition-all shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <FiImage size={18} />
                        <span>اختر من معرض الصور</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end md:col-span-2">
                    <button
                      onClick={addItem}
                      className="w-full h-11 bg-[var(--brand-obsidian)] text-amber-300 font-black rounded-xl shadow-md hover:bg-[var(--brand-obsidian-light)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiPlus className="text-xl text-amber-400" />
                      <span className="text-sm">{t('admin.add_item_btn')}</span>
                    </button>
                  </div>
                </div>

                {/* Toast Notification */}
                <AnimatePresence>
                  {showToast && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 rounded-[3rem]"
                    >
                      <div className="text-center text-white px-8">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl">✅</div>
                        <h3 className="text-3xl font-black mb-2">{t('admin.item_added_success_title')}</h3>
                        <p className="opacity-90 font-bold uppercase tracking-[0.2em] text-xs">{t('admin.item_added_success_desc')}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative group px-1 max-w-2xl mx-auto w-full">
        <FiSearch className={`absolute ${i18n.language === 'ar' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-2xl`} />
        <input
          className={`w-full bg-white border border-gray-100 rounded-2xl h-11 ${i18n.language === 'ar' ? 'pr-12 pl-5 text-right' : 'pl-12 pr-5'} text-xs sm:text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm`}
          placeholder={t('admin.search_placeholder')}
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
        />
      </div>

      {/* Items by Category */}
      <div className="space-y-2.5">
        {Object.entries(categories)
          .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
          .map(([catId, cat]) => {
            const catItems = Object.keys(localItems)
              .map(id => ({ ...localItems[id], id }))
              .filter(item => item.categoryId === catId)
              .filter(item => {
                const search = quickSearch.toLowerCase();
                const itemName = item.nameAr || item.name;
                const itemIngredients = item.ingredientsAr || item.ingredients;
                return (
                  (itemName && itemName.toLowerCase().includes(search)) ||
                  (itemIngredients && itemIngredients.toLowerCase().includes(search)) ||
                  String(item.price).includes(search)
                );
              })
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            if (quickSearch && catItems.length === 0) return null;

            const isExpanded = expandedSections[catId] ?? false;

            return (
              <div key={catId} className="bg-white border border-gray-50 rounded-xl overflow-hidden shadow-soft hover:shadow-premium transition-all">
                <button
                  onClick={() => toggleSection(catId)}
                  className="w-full p-3 sm:p-4 flex items-center justify-between group bg-gradient-to-l from-amber-50/70 via-white to-white hover:from-amber-50 transition-colors"
                >

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white text-primary flex items-center justify-center shadow-soft transition-transform group-hover:scale-110">
                      <FiChevronDown size={17} className={`transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                    <div className="text-right">
                      <h3 className="text-base sm:text-lg font-extrabold text-[var(--brand-obsidian)]">{cat.nameAr || cat.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{catItems.length} {t('admin.items_count', { count: catItems.length })}</p>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 pt-2">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEndItems(event, catItems)}
                        >
                          <SortableContext
                            items={catItems.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="flex flex-col gap-1">
                              {catItems.map((item, idx) => (
                                <SortableItem
                                  key={item.id}
                                  item={item}
                                  idx={idx}
                                  totalItems={catItems.length}
                                  subcategories={subcategories}
                                  toggleItem={toggleItem}
                                  openGallery={openGallery}
                                  removeImage={removeImage}
                                  setPopup={setPopup}
                                  moveItem={moveItem}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>

                        {catItems.length === 0 && (
                          <div className="py-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <FiSearch size={32} className="text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-bold text-lg">{t('admin.no_items_placeholder')}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>

      <FeaturedGallery
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handleSelectImage}
        manifestPath="/images/manifest.json"
        selectedImage={itemImage}
      />
    </div>
  );
};

export default ItemSection;
