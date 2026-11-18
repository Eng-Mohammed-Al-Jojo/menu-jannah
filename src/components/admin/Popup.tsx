import React from "react";
import { type PopupState } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiTrash2, FiLogOut, FiKey, FiMail, FiEdit, FiLayers, FiType, FiDollarSign, FiInfo, FiImage } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import FeaturedGallery from "./FeaturedGallery";

interface Props {
  popup: PopupState;
  setPopup: (popup: PopupState) => void;
  deleteItem?: () => void;
  updateCategoryName?: (id: string, nameAr: string) => void;
  deleteCategory?: (id: string) => void;
  addCategory?: () => void;
  addItem?: () => void;
  updateItem?: () => void;
  updateCategoryImage?: (id: string, image: string) => void;
  updateSubcategoryImage?: (id: string, image: string) => void;
  editItemValues?: {
    itemNameAr: string;
    itemPrice: string;
    priceTw: string;
    selectedCategory: string;
    selectedSubcategory: string;
    itemIngredientsAr?: string;
    itemImage?: string;
  };
  setEditItemValues?: (values: {
    itemNameAr: string;
    itemPrice: string;
    priceTw: string;
    selectedCategory: string;
    selectedSubcategory: string;
    itemIngredientsAr?: string;
    itemImage?: string;
  }) => void;
  categories?: any;
  subcategories?: any;
  addSubcategory?: (categoryId: string, nameAr: string, nameEn: string, image?: string) => void;
  updateSubcategory?: (id: string, nameAr: string, nameEn: string, image?: string) => void;
  deleteSubcategory?: (id: string) => void;
  resetPasswordPopup?: boolean;
  setResetPasswordPopup?: (val: boolean) => void;
  resetEmail?: string;
  setResetEmail?: (val: string) => void;
  resetMessage?: string;
  handleResetPassword?: () => void;
  logout?: () => void;
}

const Popup: React.FC<Props> = ({
  popup,
  setPopup,
  deleteItem,
  deleteCategory,
  updateCategoryName,
  addCategory,
  updateItem,
  updateCategoryImage,
  editItemValues,
  setEditItemValues,
  categories,
  subcategories,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryImage,
  resetPasswordPopup,
  setResetPasswordPopup,
  resetEmail,
  setResetEmail,
  resetMessage,
  handleResetPassword,
  logout,
}) => {
  const { t } = useTranslation();
  const [subNameAr, setSubNameAr] = React.useState("");
  const [subNameEn, setSubNameEn] = React.useState("");
  const [catNameAr, setCatNameAr] = React.useState("");
  const [selectedImg, setSelectedImg] = React.useState("");
  const [showGallery, setShowGallery] = React.useState(false);
  const isRtl = true;
  const isOpen = popup.type !== null || resetPasswordPopup;

  React.useEffect(() => {
    if (popup.type === "editSubcategory" && popup.id && subcategories && subcategories[popup.id]) {
      const sub = subcategories[popup.id];
      setSubNameAr(sub.nameAr || "");
      setSubNameEn(sub.nameEn || "");
      setSelectedImg(sub.image || "");
    } else if (popup.type === "editCategory" && popup.id && categories && categories[popup.id]) {
      setCatNameAr(categories[popup.id].nameAr || "");
    } else if (popup.type === "addSubcategory") {
      setSubNameAr("");
      setSubNameEn("");
      setSelectedImg("");
    }
  }, [popup.type, popup.id, subcategories, categories]);

  if (!isOpen) return null;

  const closePopup = () => {
    setPopup({ type: null });
    setResetPasswordPopup && setResetPasswordPopup(false);
  };

  const inputClass = "w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-6 text-right text-sm font-bold outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePopup}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-[3rem] border border-gray-100 shadow-premium z-10"        >
          {/* Close Button */}
          <button
            onClick={closePopup}
            className="absolute top-4 left-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-all border border-gray-100 shadow-soft z-20"
          >
            <FiX size={20} />
          </button>

          <div className="p-6">
            {/* ===== Logout ===== */}
            {popup.type === "logout" && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-secondary/5 text-secondary rounded-4xl flex items-center justify-center mx-auto text-4xl shadow-inner border border-secondary/10">
                  <FiLogOut />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.logout_title')}؟</h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.logout_confirm')}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { logout && logout(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-secondary text-white font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('admin.logout_title')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Add/Edit/Delete Subcategory ===== */}
            {(popup.type === "addSubcategory" || popup.type === "editSubcategory" || popup.type === "deleteSubcategory") && (
              <div className="text-center space-y-8">
                <div className={`w-24 h-24 rounded-4xl flex items-center justify-center mx-auto text-4xl shadow-inner border ${popup.type === 'deleteSubcategory' ? 'bg-secondary/5 text-secondary border-secondary/10' : 'bg-primary/5 text-primary border-primary/10'}`}>
                  {popup.type === 'deleteSubcategory' ? <FiTrash2 /> : (popup.type === 'editSubcategory' ? <FiEdit /> : <FiLayers />)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {popup.type === "addSubcategory" ? t('admin.add_subcategory') : (popup.type === "editSubcategory" ? t('admin.edit_subcategory') : t('admin.delete_subcategory'))}
                  </h2>
                </div>

                {(popup.type === "addSubcategory" || popup.type === "editSubcategory") && (
                  <div className="space-y-5">
                    <div className="relative group">
                      <FiType className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                      <input
                        className={inputClass}
                        placeholder={t('admin.subcategory_name_ar')}
                        value={subNameAr}
                        onChange={(e) => setSubNameAr(e.target.value)}
                      />
                    </div>

                    {/* Image Selector: Gallery Only */}
                    <div className="space-y-2 text-right">
                      <label className="text-xs font-black text-neutral-500 uppercase tracking-widest px-1">صورة التصنيف الفرعي</label>
                      <div className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                        {selectedImg ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                            <img
                              src={selectedImg.startsWith('http') || selectedImg.startsWith('/') ? selectedImg : `/images/${selectedImg}`}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImg("")}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600 cursor-pointer"
                            >
                              <FiX size={10} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0">
                            <FiImage size={22} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="truncate text-neutral-800 text-xs font-bold block" dir="ltr">{selectedImg || "لم يتم اختيار صورة"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGallery(true)}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-snouno-dark font-black hover:bg-amber-400 transition-all shrink-0 flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
                        >
                          <FiImage size={15} />
                          <span>معرض الصور</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      if (popup.type === "addSubcategory") {
                        addSubcategory && addSubcategory(popup.parentId!, subNameAr, subNameEn, selectedImg);
                      } else if (popup.type === "editSubcategory") {
                        updateSubcategory && updateSubcategory(popup.id!, subNameAr, subNameEn, selectedImg);
                      } else {
                        deleteSubcategory && deleteSubcategory(popup.id!);
                      }
                      closePopup();
                    }}
                    className={`w-full py-5 rounded-2xl text-white font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm ${popup.type === 'deleteSubcategory' ? 'bg-secondary shadow-secondary/20' : 'bg-primary shadow-primary/20'}`}
                  >
                    {popup.type === "deleteSubcategory" ? t('common.delete') : t('common.save')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Add / Edit / Delete Category ===== */}
            {(popup.type === "addCategory" || popup.type === "editCategory" || popup.type === "deleteCategory") && (
              <div className="text-center space-y-6">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner border ${
                  popup.type === 'deleteCategory'
                    ? 'bg-secondary/5 text-secondary border-secondary/10'
                    : 'bg-amber-50 text-amber-500 border-amber-100'
                }`}>
                  {popup.type === 'deleteCategory' ? <FiTrash2 /> : (popup.type === 'editCategory' ? <FiEdit /> : <FiLayers />)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {popup.type === "addCategory"
                      ? t('admin.add_category_title')
                      : (popup.type === "editCategory" ? "تعديل اسم الفئة / القسم" : t('admin.delete_category_title'))}
                  </h2>
                  <p className="text-xs text-neutral-400 font-bold mt-1">
                    {popup.type === "deleteCategory"
                      ? "هل أنت متأكد من حذف هذه الفئة بالكامل؟"
                      : "أدخل اسم الفئة للتحكم في عرضها في المنيو"}
                  </p>
                </div>

                {popup.type === "editCategory" && (
                  <div className="relative group text-right">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block mb-2 px-1">اسم الفئة / القسم</label>
                    <div className="relative">
                      <FiType className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-amber-500" />
                      <input
                        className={inputClass}
                        placeholder="أدخل اسم الفئة..."
                        value={catNameAr}
                        onChange={(e) => setCatNameAr(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && updateCategoryName && popup.id) {
                            updateCategoryName(popup.id, catNameAr);
                            closePopup();
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (popup.type === "addCategory") {
                        addCategory && addCategory();
                      } else if (popup.type === "editCategory") {
                        updateCategoryName && popup.id && updateCategoryName(popup.id, catNameAr);
                      } else {
                        deleteCategory && deleteCategory(popup.id!);
                      }
                      closePopup();
                    }}
                    className={`w-full py-4 rounded-2xl text-white font-black shadow-lg transition-all hover:scale-[1.01] active:scale-98 uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-pointer ${
                      popup.type === 'deleteCategory'
                        ? 'bg-secondary shadow-secondary/20 hover:bg-red-600'
                        : 'bg-amber-500 text-snouno-dark shadow-amber-500/20 hover:bg-amber-400'
                    }`}
                  >
                    <FiCheck size={18} />
                    <span>
                      {popup.type === "addCategory"
                        ? "تأكيد الإضافة"
                        : (popup.type === "editCategory" ? "تأكيد التعديل" : t('common.delete'))}
                    </span>
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Category/Subcategory Image Selection ===== */}
            {(popup.type === "categoryImage" || popup.type === "subcategoryImage") && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-primary/5 text-primary rounded-4xl border border-primary/10 flex items-center justify-center mx-auto text-4xl shadow-inner">
                  <FiImage />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.select_image')}</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    {selectedImg ? (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm relative group">
                        <img
                          src={selectedImg.startsWith('http') || selectedImg.startsWith('/') ? selectedImg : `/images/${selectedImg}`}
                          alt="معاينة"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImg("")}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md hover:bg-red-600 cursor-pointer"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-neutral-100 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400">
                        <FiImage size={32} />
                        <span className="text-[10px] font-bold mt-1">بدون صورة</span>
                      </div>
                    )}
                    <span className="text-xs font-bold text-neutral-700 truncate max-w-full" dir="ltr">
                      {selectedImg || "لم يتم اختيار صورة"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGallery(true)}
                      className="w-full py-3 rounded-xl bg-amber-500 text-snouno-dark font-black text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FiImage size={16} />
                      <span>اختر من معرض الصور</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      if (popup.type === "categoryImage") {
                        updateCategoryImage && popup.id && updateCategoryImage(popup.id, selectedImg);
                      } else {
                        updateSubcategoryImage && popup.id && updateSubcategoryImage(popup.id, selectedImg);
                      }
                      closePopup();
                      setSelectedImg("");
                    }}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Delete Item ===== */}
            {popup.type === "deleteItem" && (
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-secondary/5 text-secondary rounded-4xl border border-secondary/10 flex items-center justify-center mx-auto text-4xl shadow-inner">
                  <FiTrash2 />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.delete_item_title')}</h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.delete_item_confirm')}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { deleteItem && deleteItem(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-secondary text-white font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.delete')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Edit Item ===== */}
            {popup.type === "editItem" && editItemValues && setEditItemValues && categories && (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl shadow-inner border border-amber-100">
                    <FiEdit />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('admin.edit_product_title')}</h2>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mt-1">{t('admin.edit_product_desc')}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative group">
                    <FiLayers className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <select
                      className={`${inputClass} appearance-none cursor-pointer`}
                      value={editItemValues.selectedCategory}
                      onChange={(e) => setEditItemValues({ ...editItemValues, selectedCategory: e.target.value, selectedSubcategory: "" })}
                    >
                      {Object.keys(categories).map((id) => (
                        <option key={id} value={id}>{categories[id].nameAr}</option>
                      ))}
                    </select>
                  </div>

                  {editItemValues.selectedCategory && subcategories && (
                    <div className="relative group">
                      <FiLayers className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                      <select
                        className={`${inputClass} appearance-none cursor-pointer`}
                        value={editItemValues.selectedSubcategory}
                        onChange={(e) => setEditItemValues({ ...editItemValues, selectedSubcategory: e.target.value })}
                      >
                        <option value="">{t('admin.no_subcategory')}</option>
                        {Object.entries(subcategories)
                          .filter(([, s]: any) => s.categoryId === editItemValues.selectedCategory)
                          .map(([id, s]: any) => (
                            <option key={id} value={id}>{s.nameAr}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="relative group">
                    <FiType className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <input
                      className={inputClass}
                      placeholder={t('admin.product_name_ar')}
                      value={editItemValues.itemNameAr}
                      onChange={(e) => setEditItemValues({ ...editItemValues, itemNameAr: e.target.value })}
                    />
                  </div>

                  <div className="relative group">
                    <FiInfo className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <input
                      className={inputClass}
                      placeholder={t('admin.ingredients_placeholder')}
                      value={editItemValues.itemIngredientsAr || ""}
                      onChange={(e) => setEditItemValues({ ...editItemValues, itemIngredientsAr: e.target.value })}
                    />
                  </div>

                  <div className="relative group">
                    <FiDollarSign className="right-5 absolute top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary" />
                    <input
                      className={inputClass}
                      placeholder={t('common.total')}
                      value={editItemValues.itemPrice}
                      onChange={(e) => setEditItemValues({ ...editItemValues, itemPrice: e.target.value })}
                    />
                  </div>

                  {/* Image Selector: Gallery Only */}
                  <div className="space-y-2 text-right">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest px-1">صورة المنتج</label>
                    <div className="flex items-center gap-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                      {editItemValues.itemImage ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shrink-0">
                          <img
                            src={editItemValues.itemImage.startsWith('http') || editItemValues.itemImage.startsWith('/') ? editItemValues.itemImage : `/images/${editItemValues.itemImage}`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                          />
                          <button
                            type="button"
                            onClick={() => setEditItemValues({ ...editItemValues, itemImage: "" })}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-red-600 cursor-pointer"
                          >
                            <FiX size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0">
                          <FiImage size={22} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-neutral-800 text-xs font-bold block" dir="ltr">{editItemValues.itemImage || "لم يتم اختيار صورة"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGallery(true)}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-snouno-dark font-black hover:bg-amber-400 transition-all shrink-0 flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
                      >
                        <FiImage size={15} />
                        <span>معرض الصور</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => { updateItem && updateItem(); closePopup(); }}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                  >
                    <FiCheck size={20} /> {t('admin.save_edits')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ===== Reset Password ===== */}
            {resetPasswordPopup && (
              <div className="space-y-8">
                <div className="text-center space-y-6 mb-2">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-4xl border border-blue-100 flex items-center justify-center mx-auto text-4xl shadow-inner">
                    <FiKey />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('admin.account_reset_title')}</h2>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[11px]">{t('admin.account_reset_desc')}</p>
                  </div>
                </div>

                <div className="relative group">
                  <FiMail className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-primary`} />
                  <input
                    type="email"
                    placeholder={t('admin.email_placeholder')}
                    className={`${inputClass} ${isRtl ? '' : 'pl-12 pr-6 text-left'}`}
                    value={resetEmail}
                    onChange={(e) => setResetEmail && setResetEmail(e.target.value)}
                  />
                </div>

                <AnimatePresence>
                  {resetMessage && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-xs text-center text-emerald-600 font-black bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
                      {resetMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleResetPassword}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('admin.send_reset_link')}
                  </button>
                  <button
                    onClick={closePopup}
                    className="w-full py-5 rounded-2xl bg-gray-50 text-gray-400 font-black border border-gray-100 hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div >

      <FeaturedGallery
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(img) => {
          if (popup.type === "editItem" && editItemValues && setEditItemValues) {
            setEditItemValues({ ...editItemValues, itemImage: img });
          } else {
            setSelectedImg(img);
          }
          setShowGallery(false);
        }}
        manifestPath="/images/manifest.json"
        selectedImage={popup.type === "editItem" ? editItemValues?.itemImage : selectedImg}
      />
    </AnimatePresence >
  );
};

export default Popup;
