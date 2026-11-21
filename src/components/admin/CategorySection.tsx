import React, { useState } from "react";
import { FiPlus, FiTrash2, FiEdit, FiCheck, FiChevronDown, FiMove, FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { db } from "../../firebase";
import { ref, update } from "firebase/database";
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
import type { PopupState, Category, Subcategory } from "./types";

interface Props {
  categories: Record<string, Category>;
  subcategories: Record<string, Subcategory>;
  setPopup: (popup: PopupState) => void;
  toggleCategoryVisibility: (id: string, current: boolean) => void;
  toggleSubcategoryVisibility: (id: string, current: boolean) => void;
  updateCategoryImage: (id: string, image: string) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  newCategoryNameAr: string;
  setNewCategoryNameAr: (val: string) => void;
}

const CategoryCard: React.FC<{
  cat: Category & { id: string };
  subcategories: Record<string, Subcategory>;
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  editNameAr: string;
  setEditNameAr: React.Dispatch<React.SetStateAction<string>>;
  saveEdit: (id: string) => void;
  toggleCategoryVisibility: (id: string, current: boolean) => void;
  toggleSubcategoryVisibility: (id: string, current: boolean) => void;
  updateCategoryImage: (id: string, image: string) => void;
  setPopup: (popup: PopupState) => void;
}> = ({
  cat,
  subcategories,
  editingId,
  setEditingId,
  editNameAr,
  setEditNameAr,
  saveEdit,
  toggleCategoryVisibility,
  toggleSubcategoryVisibility,
  updateCategoryImage,
  setPopup,
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: cat.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      touchAction: "none",
    };

    const catSubcategories = Object.entries(subcategories)
      .filter(([, sub]) => sub.categoryId === cat.id)
      .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        layout
        className={`
          relative group flex flex-col bg-white rounded-2xl border transition-all duration-300 overflow-hidden h-full
          ${isDragging ? "z-50 border-primary shadow-premium scale-[1.02]" : "border-gray-100 hover:border-primary/20 shadow-soft hover:shadow-premium"}
          ${!cat.visible ? "opacity-60 grayscale-[0.5]" : ""}
        `}
      >
        {/* Category Image Header */}
        <div className="relative h-32 bg-gray-50 overflow-hidden group/img">
          {cat.image ? (
            <img
              src={cat.image.startsWith('http') || cat.image.startsWith('/') ? cat.image : `/images/${cat.image}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FiPlus size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('admin.add_image')}</span>
            </div>
          )}

          {/* Image Controls Overlay */}
          <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => setPopup({ type: "categoryImage", id: cat.id })}
              className="w-10 h-10 bg-white text-primary rounded-xl hover:scale-110 transition-transform flex items-center justify-center shadow-lg"
            >
              <FiEdit size={16} />
            </button>
            {cat.image && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateCategoryImage(cat.id, "");
                }}
                className="w-10 h-10 bg-secondary text-white rounded-xl hover:scale-110 transition-transform flex items-center justify-center shadow-lg"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>

          {/* Drag Handle Overlay */}
          <div
            {...listeners}
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md text-gray-500 rounded-xl cursor-grab active:cursor-grabbing hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <FiMove size={14} />
          </div>

          {/* Visibility Badge */}
          <div className="absolute top-4 left-4">
            <button
              onClick={() => toggleCategoryVisibility(cat.id, cat.visible ?? true)}
              className={`p-2.5 rounded-xl backdrop-blur-md transition-all shadow-sm ${cat.visible
                ? "bg-emerald-500/90 text-white"
                : "bg-secondary/90 text-white"}`}
            >
              {cat.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex-1 min-w-0 mb-4">
            {editingId === cat.id ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-amber-600">تعديل اسم القسم</label>
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    className="flex-1 p-3 bg-neutral-50 border-2 border-amber-500 rounded-xl text-sm font-bold outline-none text-right focus:bg-white transition-all shadow-xs"
                    value={editNameAr}
                    onChange={(e) => setEditNameAr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
                  />
                  <button
                    onClick={() => saveEdit(cat.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-snouno-dark font-black text-xs shrink-0 shadow-md flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
                    title="تأكيد التعديل"
                  >
                    <FiCheck size={14} />
                    <span>تأكيد التعديل</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2.5 rounded-xl bg-neutral-200 text-neutral-600 font-bold text-xs shrink-0 hover:bg-neutral-300 cursor-pointer"
                    title="إلغاء"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 truncate" title={cat.nameAr}>
                  {cat.nameAr}
                </h3>
                <button
                  onClick={() => setPopup({ type: "editCategory", id: cat.id })}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border border-amber-200/50 cursor-pointer"
                  title="تعديل اسم القسم"
                >
                  <FiEdit size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {catSubcategories.length} {t('admin.subcategories')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
                className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-lg transition-all font-bold border ${isExpanded
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-white hover:border-primary/30 hover:text-primary"
                }`}
            >
              <span className="text-xs uppercase tracking-wider">{t('admin.subcategories')}</span>
              <FiChevronDown className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            <button
              onClick={() => setPopup({ type: "deleteCategory", id: cat.id })}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary-50 text-secondary hover:bg-secondary hover:text-white transition-all border border-secondary-100 shadow-sm active:scale-95"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>

        {/* Subcategories Accordion */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-50/50 border-t border-gray-50"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between mb-2 px-1 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{t('admin.manage_sub')}</span>
                  <button
                    type="button"
                    onClick={() => setPopup({ type: "addSubcategory", parentId: cat.id })}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[11px] font-black text-snouno-dark shadow-sm transition hover:bg-amber-400 active:scale-95"
                  >
                    <FiPlus size={13} />
                    إضافة قسم فرعي
                  </button>
                </div>

                {catSubcategories.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {catSubcategories.map(([id, sub]) => (
                      <div
                        key={id}
                        className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:border-primary/20 ${!sub.visible ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => setPopup({ type: "subcategoryImage", id })}
                            className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 group/sub"
                          >
                            {sub.image ? (
                              <img src={sub.image.startsWith('http') || sub.image.startsWith('/') ? sub.image : `/images/${sub.image}`} alt="" className="w-full h-full object-cover transition-transform group-hover/sub:scale-110" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                            ) : (
                              <FiPlus size={14} className="text-gray-300" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-800 block truncate">{sub.nameAr}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSubcategoryVisibility(id, sub.visible ?? true)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${sub.visible ? "text-emerald-500 hover:bg-emerald-50" : "text-secondary hover:bg-secondary-50"}`}
                          >
                            {sub.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => setPopup({ type: "editSubcategory", id })}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => setPopup({ type: "deleteSubcategory", id })}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[11px] font-bold text-gray-400 italic">{t('admin.no_subcategories')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

const CategorySection: React.FC<Props> = ({
  categories,
  subcategories,
  setPopup,
  toggleCategoryVisibility,
  toggleSubcategoryVisibility,
  updateCategoryImage,
  showNotification,
  newCategoryNameAr,
  setNewCategoryNameAr,
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [openCategories, setOpenCategories] = useState(false);



  const saveEdit = async (id: string) => {
    if (!editNameAr.trim()) {
      showNotification(t('admin.category_name_required'), 'error');
      return;
    }
    try {
      await update(ref(db, `categories/${id}`), {
        nameAr: editNameAr.trim(),
      });
      setEditingId(null);
      setEditNameAr("");
      showNotification(t('common.success') + " ✅");
    } catch {
      showNotification(t('common.error'), 'error');
    }
  };

  const categoriesArray = Object.entries(categories)
    .map(([id, cat]) => ({ ...cat, id }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoriesArray.findIndex((c) => c.id === active.id);
    const newIndex = categoriesArray.findIndex((c) => c.id === over.id);

    const newArray = arrayMove(categoriesArray, oldIndex, newIndex);

    const updates: Record<string, any> = {};
    newArray.forEach((cat, index) => {
      updates[`categories/${cat.id}/order`] = index;
    });

    await update(ref(db), updates);
  };

  return (
    <div>
      {/* Add Category Inline Form */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          value={newCategoryNameAr}
          onChange={(e) => setNewCategoryNameAr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPopup({ type: "addCategory" })}
          placeholder={t('admin.add_category_placeholder')}
          className="flex-1 h-12 px-5 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm font-bold outline-none text-right focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/5 transition-all placeholder:text-neutral-400"
        />
        <button
          onClick={() => setPopup({ type: "addCategory" })}
          className="h-12 px-5 flex items-center justify-center gap-2 rounded-2xl bg-amber-500 text-snouno-dark font-black text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <FiPlus size={16} />
          <span className="hidden sm:block font-bold">تأكيد إضافة القسم</span>
        </button>
      </div>

      {/* View Categories Toggle */}
      <button
        onClick={() => setOpenCategories((p) => !p)}
        className="w-full mb-2 flex items-center justify-between px-5 sm:px-6 py-4 bg-neutral-50 rounded-2xl font-bold text-sm text-neutral-700 hover:bg-amber-500/5 hover:text-amber-700 transition-all border border-neutral-100 shadow-inner group"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-white text-amber-500 flex items-center justify-center shadow-soft transition-transform group-hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${openCategories ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
          </span>
          <span className="font-bold">{t('admin.view_all_categories')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hidden sm:inline">{t('admin.total')}</span>
          <span className="bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow shadow-amber-500/25">
            {categoriesArray.length}
          </span>
        </div>
      </button>

      {/* Accordion List */}
      <AnimatePresence>
        {openCategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categoriesArray.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoriesArray.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        cat={cat}
                        subcategories={subcategories}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        editNameAr={editNameAr}
                        setEditNameAr={setEditNameAr}
                        saveEdit={saveEdit}
                        toggleCategoryVisibility={toggleCategoryVisibility}
                        toggleSubcategoryVisibility={toggleSubcategoryVisibility}
                        updateCategoryImage={updateCategoryImage}
                        setPopup={setPopup}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySection;
