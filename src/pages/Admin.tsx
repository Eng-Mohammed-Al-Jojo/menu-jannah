import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { ref, onValue, remove, update, set, push } from "firebase/database";
import {
  FiSettings, FiLock, FiMail, FiUser
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeIngredients } from "../utils/stringUtils";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

import CategorySection from "../components/admin/CategorySection";
import ItemSection from "../components/admin/ItemSection";
import Popup from "../components/admin/Popup";
import { type PopupState } from "../components/admin/types";
import PaymentMethodsModal from "../components/admin/PaymentMethodsModal";
import AdminLayout from "../components/admin/AdminLayout";


export default function Admin() {
  const { t } = useTranslation();
  const location = useLocation();
  const [authOk, setAuthOk] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [categories, setCategories] = useState<any>({});
  const [subcategories, setSubcategories] = useState<any>({});
  const [newCategoryNameAr, setNewCategoryNameAr] = useState("");
  const [items, setItems] = useState<any>({});
  const [popup, setPopup] = useState<PopupState>({ type: null });
  const [resetPasswordPopup, setResetPasswordPopup] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [editItemValues, setEditItemValues] = useState<{
    itemNameAr: string;
    itemPrice: string;
    priceTw: string;
    selectedCategory: string;
    selectedSubcategory: string;
    itemIngredientsAr?: string;
    itemImage?: string;
  }>({
    itemNameAr: "",
    itemPrice: "",
    priceTw: "",
    selectedCategory: "",
    selectedSubcategory: "",
    itemIngredientsAr: "",
    itemImage: "",
  });
  const [editItemId, setEditItemId] = useState("");
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [settings, setSettings] = useState({
    orderSystem: false,
    orderSettings: { inRestaurant: false, takeaway: false, inPhone: "", outPhone: "" },
    complaintsWhatsapp: "",
    footerInfo: { address: "", phone: "", whatsapp: "", facebook: "", instagram: "", tiktok: "" },
  });

  // ================= NOTIFICATIONS =================
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ================= AUTH LISTENER =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthOk(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => {
    };
  }, [location.pathname]);

  // ================= FIREBASE DATA =================
  useEffect(() => {
    if (!authOk) return;
    const catRef = ref(db, "categories");
    const subcatRef = ref(db, "subcategories");
    const itemRef = ref(db, "items");
    const settingsRef = ref(db, "settings");

    const unsubCats = onValue(catRef, (snap) => setCategories(snap.val() || {}));
    const unsubSubcats = onValue(subcatRef, (snap) => setSubcategories(snap.val() || {}));
    const unsubItems = onValue(itemRef, (snap) => setItems(snap.val() || {}));

    const unsubSettings = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.val());
      } else {
        const defaultSettings = {
          complaintsWhatsapp: "",
          footerInfo: { address: "", facebook: "", instagram: "", phone: "", tiktok: "", whatsapp: "" },
          orderSettings: { inRestaurant: true, inPhone: "", takeaway: true, outPhone: "" },
          orderSystem: true
        };
        set(settingsRef, defaultSettings);
        setSettings(defaultSettings);
      }
    });

    return () => {
      unsubCats();
      unsubSubcats();
      unsubItems();
      unsubSettings();
    };
  }, [authOk]);

  // ================= ACTIONS =================
  const login = async () => {
    if (!email || !password) {
      showNotification(t('admin.enter_email_password'), 'error');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification(t('admin.welcome_back') + " ✅");
    } catch {
      showNotification(t('admin.invalid_credentials'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setResetMessage(t('admin.enter_email_first'));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(t('admin.reset_email_sent'));
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const logout = async () => {
    signOut(auth).then(() => {
      showNotification(t('admin.logout_success') + " 👋");
      setAuthOk(false);
    });
    setPopup({ type: null });
  };

  const addCategory = async () => {
    if (!newCategoryNameAr.trim()) {
      showNotification(t('admin.category_name_required'), 'error');
      return;
    }
    const nameAr = newCategoryNameAr.trim();

    const exists = Object.values(categories).some(
      (cat: any) => (cat.nameAr || "").trim().toLowerCase() === nameAr.toLowerCase()
    );
    if (nameAr && exists) {
      showNotification(t('admin.category_exists', { name: nameAr }), 'error');
      return;
    }
    await push(ref(db, "categories"), {
      name: nameAr,
      nameAr,
      visible: true,
      createdAt: Date.now()
    });
    setNewCategoryNameAr("");
    setPopup({ type: null });
    showNotification(t('admin.category_added_success', { name: nameAr }) + " ✅");
  };

  const deleteCategory = async (id: string) => {
    await remove(ref(db, `categories/${id}`));
    Object.keys(subcategories).forEach((subId) => {
      if (subcategories[subId].categoryId === id) remove(ref(db, `subcategories/${subId}`));
    });
    Object.keys(items).forEach((itemId) => {
      if (items[itemId].categoryId === id) remove(ref(db, `items/${itemId}`));
    });
    setPopup({ type: null });
    showNotification(t('admin.category_deleted_success') + " ✅");
  };

  const addSubcategory = async (categoryId: string, nameAr: string, image?: string) => {
    if (!nameAr.trim()) {
      showNotification(t('admin.subcategory_name_required'), 'error');
      return;
    }
    await push(ref(db, "subcategories"), {
      nameAr: nameAr.trim(),
      categoryId,
      image: image || "",
      visible: true,
      order: Object.values(subcategories).filter((s: any) => s.categoryId === categoryId).length,
      createdAt: Date.now()
    });
    showNotification(t('admin.subcategory_added_success') + " ✅");
  };

  const deleteSubcategory = async (id: string) => {
    await remove(ref(db, `subcategories/${id}`));
    Object.keys(items).forEach((itemId) => {
      if (items[itemId].subcategoryId === id) {
        update(ref(db, `items/${itemId}`), { subcategoryId: null });
      }
    });
    setPopup({ type: null });
    showNotification(t('admin.subcategory_deleted_success') + " ✅");
  };

  const deleteItem = async () => {
    if (!popup.id) return;
    await remove(ref(db, `items/${popup.id}`));
    setPopup({ type: null });
    showNotification(t('admin.item_deleted_success'));
  };

  const updateSubcategory = async (id: string, nameAr: string, nameEn: string, image?: string) => {
    if (!nameAr.trim()) {
      showNotification(t('admin.subcategory_name_required'), 'error');
      return;
    }
    await update(ref(db, `subcategories/${id}`), {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      image: image || ""
    });
    showNotification(t('admin.subcategory_updated_success') + " ✅");
  };

  const toggleCategoryVisibility = async (id: string, current: boolean) => {
    await update(ref(db, `categories/${id}`), { visible: !current });
  };

  const toggleSubcategoryVisibility = async (id: string, current: boolean) => {
    await update(ref(db, `subcategories/${id}`), { visible: !current });
  };

  const updateItem = async () => {
    if (!editItemId) return;
    await update(ref(db, `items/${editItemId}`), {
      nameAr: editItemValues.itemNameAr,
      ingredientsAr: normalizeIngredients(editItemValues.itemIngredientsAr || ""),
      price: editItemValues.itemPrice,
      priceTw: editItemValues.priceTw || "",
      categoryId: editItemValues.selectedCategory,
      subcategoryId: editItemValues.selectedSubcategory || null,
      image: editItemValues.itemImage || "",
    });
    setPopup({ type: null });
    setEditItemId("");
    setEditItemValues({
      itemNameAr: "", itemPrice: "", priceTw: "",
      selectedCategory: "", selectedSubcategory: "", itemIngredientsAr: "", itemImage: ""
    });
    showNotification(t('common.success') + " ✅");
  };

  const updateCategoryName = async (id: string, nameAr: string) => {
    if (!nameAr.trim()) {
      showNotification(t('admin.category_name_required'), 'error');
      return;
    }
    await update(ref(db, `categories/${id}`), {
      nameAr: nameAr.trim(),
    });
    setPopup({ type: null });
    showNotification(t('common.success') + " ✅");
  };

  const updateCategoryImage = async (id: string, image: string) => {
    await update(ref(db, `categories/${id}`), { image });
    showNotification(t('common.success') + " ✅");
  };

  const updateSubcategoryImage = async (id: string, image: string) => {
    await update(ref(db, `subcategories/${id}`), { image });
    showNotification(t('common.success') + " ✅");
  };

  // ================= EXCEL/BACKUP =================
  const exportToExcel = async () => {
    if (!categories || !items) return;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Items");
    sheet.columns = [
      { header: t('admin.excel_name'), key: "name", width: 30 },
      { header: t('admin.excel_price'), key: "price", width: 15 },
      { header: t('admin.excel_price_tw'), key: "priceTw", width: 15 },
      { header: t('admin.excel_category'), key: "categoryName", width: 30 },
      { header: t('admin.excel_ingredients'), key: "ingredients", width: 40 },
      { header: t('admin.excel_available'), key: "visible", width: 10 },
      { header: t('admin.excel_featured'), key: "star", width: 10 },
      { header: t('admin.excel_image'), key: "image", width: 25 },
    ];
    Object.values(items).forEach((item: any) => {
      sheet.addRow({
        name: item.nameAr,
        price: item.price,
        priceTw: item.priceTw || "",
        categoryName: categories[item.categoryId]?.nameAr ?? t('admin.excel_not_specified'),
        subcategoryName: item.subcategoryId ? (subcategories[item.subcategoryId]?.nameAr ?? "") : "",
        ingredients: item.ingredientsAr || "",
        visible: item.visible ? t('admin.excel_yes') : t('admin.excel_no'),
        star: item.star ? "⭐" : "", image: item.image || "",
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "menu.xlsx");
    showNotification(t('admin.export_success'));
  };

  const exportToJSON = () => {
    const data = { categories, subcategories, items, settings, meta: { version: "1.0", exportedAt: Date.now() } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, "menu-backup.json");
    showNotification(t('admin.backup_success'));
  };

  if (!authOk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snouno-dark p-6 relative overflow-hidden" dir="rtl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 hero-watermark pointer-events-none opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm relative z-10"
          style={{
            background: "var(--brand-obsidian-light)",
            borderRadius: "28px",
            border: "1px solid rgba(245,158,11,0.14)",
            padding: "40px 36px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-lg" />
              <img
                src="/logo.png"
                alt="شعار جنة"
                className="relative w-full h-full object-contain drop-shadow-[0_6px_18px_rgba(245,158,11,0.35)]"
                onError={(e) => e.currentTarget.src = '/hamada.png'}
              />
            </div>
            <h1 className="text-xl font-black text-white text-center">{t('admin.login_title')}</h1>
            <p className="text-xs text-amber-400/60 font-medium uppercase tracking-widest mt-1.5 text-center">{t('admin.login_subtitle')}</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/50" size={16} />
              <input
                type="email"
                className="w-full rounded-xl py-3.5 pr-11 pl-4 text-sm font-medium outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  color: "white",
                }}
                placeholder={t('admin.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(el) => (el.target.style.borderColor = "rgba(245,158,11,0.5)")}
                onBlur={(el) => (el.target.style.borderColor = "rgba(245,158,11,0.15)")}
              />
            </div>

            <div className="relative">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/50" size={16} />
              <input
                type="password"
                className="w-full rounded-xl py-3.5 pr-11 pl-4 text-sm font-medium outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  color: "white",
                }}
                placeholder={t('admin.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                onFocus={(el) => (el.target.style.borderColor = "rgba(245,158,11,0.5)")}
                onBlur={(el) => (el.target.style.borderColor = "rgba(245,158,11,0.15)")}
              />
            </div>

            <button
              onClick={login}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "var(--brand-amber)",
                color: "var(--brand-obsidian)",
                boxShadow: "0 6px 20px rgba(245,158,11,0.30)",
              }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                  <FiSettings size={16} />
                </motion.div>
              ) : <FiUser size={16} />}
              {t('admin.login_btn')}
            </button>

            <div className="text-center pt-1">
              <button
                onClick={() => setResetPasswordPopup(true)}
                className="text-xs font-semibold text-amber-500/60 hover:text-amber-400 transition-colors"
              >
                {t('admin.forgot_password')}
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 30, x: '-50%' }}
              className={`fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-full shadow-2xl text-sm font-bold border ${toast.type === 'success'
                ? 'bg-snouno-dark text-amber-400 border-amber-500/25'
                : 'bg-red-600 text-white border-red-500/40'
                }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <Popup
          popup={popup}
          setPopup={setPopup}
          resetPasswordPopup={resetPasswordPopup}
          setResetPasswordPopup={setResetPasswordPopup}
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
          resetMessage={resetMessage}
          handleResetPassword={handleResetPassword}
        />
      </div>
    );
  }

  const categoriesCount = Object.keys(categories).length;
  const itemsCount = Object.keys(items).length;

  return (
    <AdminLayout
      title="إدارة المنيو والمنتجات"
      subtitle="لوحة التحكم الرئيسية لجنة"
      activeNav="menu"
      orderSystemActive={settings.orderSystem}
      onLogout={() => setPopup({ type: "logout" })}
      onOpenPaymentMethods={() => setShowPaymentMethods(true)}
      onExportExcel={exportToExcel}
      onImportExcel={() => document.getElementById("excelUpload")?.click()}
      onExportJSON={exportToJSON}
      stats={{
        categoriesCount,
        itemsCount,
      }}
    >
      <input type="file" accept=".xlsx" id="excelUpload" hidden onChange={() => {
        showNotification(t('admin.importing_data'), 'success');
      }} />

      {/* ── Tabs ── */}
      <div className="flex flex-col gap-4">

        {/* Tab Bar */}
        <div className="flex items-center gap-1.5 bg-white border border-amber-500/12 rounded-xl p-1 shadow-xs w-fit">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories'
                ? 'bg-snouno-dark text-amber-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
              }`}
          >
            <span>🗂</span>
            <span>{t('admin.categories')}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'categories' ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-100 text-neutral-500'
              }`}>
              {Object.keys(categories).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'items'
                ? 'bg-snouno-dark text-amber-400 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
              }`}
          >
            <span>🍽</span>
            <span>{t('admin.products')}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'items' ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-100 text-neutral-500'
              }`}>
              {Object.keys(items).length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'categories' && (
            <section className="bg-white rounded-2xl border border-amber-500/12 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <h2 className="text-base font-black text-neutral-900">{t('admin.categories')}</h2>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">{t('admin.category_desc')}</p>
                  </div>
                </div>

              </div>
              <div className="p-3 sm:p-4">
                <CategorySection
                  categories={categories}
                  subcategories={subcategories}
                  setPopup={setPopup}
                  toggleCategoryVisibility={toggleCategoryVisibility}
                  toggleSubcategoryVisibility={toggleSubcategoryVisibility}
                  updateCategoryImage={updateCategoryImage}
                  showNotification={showNotification}
                  newCategoryNameAr={newCategoryNameAr}
                  setNewCategoryNameAr={setNewCategoryNameAr}
                />
              </div>
            </section>
          )}

          {activeTab === 'items' && (
            <section className="bg-white rounded-2xl border border-amber-500/12 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-8 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <h2 className="text-base font-black text-neutral-900">{t('admin.products')}</h2>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">{t('admin.add_item_desc', 'إدارة أصناف المنيو وتنظيمها')}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <ItemSection
                  categories={categories}
                  subcategories={subcategories}
                  items={items}
                  popup={popup}
                  setPopup={(p) => {
                    setPopup(p);
                    if (p.type === "editItem" && p.id) {
                      const item = items[p.id];
                      if (item) {
                        setEditItemId(p.id);
                        setEditItemValues({
                          itemNameAr: item.nameAr || "",
                          itemPrice: item.price || "",
                          priceTw: item.priceTw || "",
                          selectedCategory: item.categoryId || "",
                          selectedSubcategory: item.subcategoryId || "",
                          itemIngredientsAr: item.ingredientsAr || "",
                          itemImage: item.image || "",
                        });
                      }
                    }
                  }}
                />
              </div>
            </section>
          )}
        </div>
      </div>

      <Popup
        popup={popup}
        setPopup={setPopup}
        addCategory={addCategory}
        updateCategoryName={updateCategoryName}
        deleteCategory={deleteCategory}
        deleteItem={deleteItem}
        updateItem={updateItem}
        editItemValues={editItemValues}
        setEditItemValues={setEditItemValues}
        categories={categories}
        subcategories={subcategories}
        addSubcategory={addSubcategory}
        updateSubcategory={updateSubcategory}
        deleteSubcategory={deleteSubcategory}
        updateCategoryImage={updateCategoryImage}
        updateSubcategoryImage={updateSubcategoryImage}
        logout={logout}
        resetPasswordPopup={resetPasswordPopup}
        setResetPasswordPopup={setResetPasswordPopup}
        resetEmail={resetEmail}
        setResetEmail={setResetEmail}
        resetMessage={resetMessage}
        handleResetPassword={handleResetPassword}
      />

      <PaymentMethodsModal
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3.5 rounded-full shadow-xl font-bold text-sm border ${toast.type === 'success'
              ? 'bg-snouno-dark text-amber-400 border-amber-500/25'
              : 'bg-red-600 text-white border-red-500/40'
              }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
