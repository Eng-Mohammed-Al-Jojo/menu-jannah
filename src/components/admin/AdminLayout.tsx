import React, { useState } from "react";
import {
  FiMenu, FiX, FiLayout, FiPackage, FiSettings,
  FiTag, FiLogOut, FiExternalLink, FiChevronRight,
  FiChevronLeft, FiDatabase, FiUpload, FiDownload, FiDollarSign
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrderSystem } from "../../context/OrderSystemContext";
import { ORDER_SYSTEM_ENABLED } from "../../config/orderSystem";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeNav?: "menu" | "orders" | "promotions" | "settings" | "payments";
  title?: string;
  subtitle?: string;
  onLogout?: () => void;
  onOpenPaymentMethods?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onExportJSON?: () => void;
  orderSystemActive?: boolean;
  stats?: {
    categoriesCount?: number;
    itemsCount?: number;
    activeItemsCount?: number;
  };
}

export default function AdminLayout({
  children,
  title = "إدارة المنيو والمنتجات",
  subtitle = "لوحة التحكم الرئيسية",
  onLogout,
  onOpenPaymentMethods,
  onExportExcel,
  onImportExcel,
  onExportJSON,
  orderSystemActive,
  stats,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderSystemActive: globalOrderActive } = useOrderSystem();

  const isOrderActive = ORDER_SYSTEM_ENABLED && (orderSystemActive !== undefined ? orderSystemActive : globalOrderActive);

  // Sidebar toggle state (desktop collapsed, mobile drawer open)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = location.pathname;
  const isOrdersPage = pathname === '/admin/orders';
  const isPromotionsPage = pathname === '/admin/promotions';
  const isSettingsPage = pathname === '/admin/settings';

  const navItems = [
    {
      id: "menu",
      label: "إدارة المنيو",
      icon: FiLayout,
      path: "/admin",
      badge: stats?.itemsCount !== undefined ? String(stats.itemsCount) : undefined,
    },
    ...(isOrderActive ? [{
      id: "orders",
      label: "إدارة الطلبات",
      icon: FiPackage,
      path: "/admin/orders",
      badge: "حيّ",
      badgeColor: "bg-amber-500 text-snouno-dark",
    }] : []),
    {
      id: "promotions",
      label: "العروض والترويج",
      icon: FiTag,
      path: "/admin/promotions",
      badge: undefined,
      badgeColor: undefined,
    },
    {
      id: "settings",
      label: "إعدادات النظام",
      icon: FiSettings,
      path: "/admin/settings",
      badge: undefined,
      badgeColor: undefined,
    },
  ];

  return (
    <div className="admin-compact min-h-screen flex bg-[linear-gradient(135deg,#EFE6C9_0%,#F8F4E8_48%,#EFE6C9_100%)] text-neutral-900 font-sans" dir="rtl">
      {/* ═══════════════════════════════════════
          MOBILE BACKDROP OVERLAY
          ═══════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          SIDEBAR — AdminLTE Obsidian Dark Style
          ═══════════════════════════════════════ */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-50 h-screen bg-snouno-dark text-white border-l border-amber-500/15 flex flex-col justify-between transition-all duration-300 transform-gpu shrink-0 ${
          mobileMenuOpen
            ? "translate-x-0 w-72"
            : "translate-x-full md:translate-x-0"
          } ${sidebarCollapsed ? "md:w-16" : "md:w-64"}`}
      >
        {/* Sidebar Top / Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-amber-500/15 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/jannah-logo.jpg"
                alt="جنة"
                className="w-7 h-7 rounded-lg object-cover border border-amber-500/30"
              />
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-base text-white truncate tracking-wide">
                  جنة
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-neutral-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "توسيع القائمة" : "طّي القائمة"}
          >
            {sidebarCollapsed ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-neutral-400 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-2 py-2">
          {/* Quick Admin Profile Card */}
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="m-4 p-3 rounded-2xl bg-white/5 border border-amber-500/10 flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-snouno-dark font-black flex items-center justify-center text-sm shadow-sm">
                  أ
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-snouno-dark" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">مدير النظام</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  متصل الآن
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            <span
              className={`text-[10px] uppercase font-bold text-neutral-400 px-3 py-1 block tracking-widest ${
                sidebarCollapsed && !mobileMenuOpen ? "text-center opacity-0" : ""
              }`}
            >
              القائمة الرئيسية
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.id === "menu" && !isOrdersPage && !isPromotionsPage && !isSettingsPage) ||
                (item.id === "orders" && isOrdersPage) ||
                (item.id === "promotions" && isPromotionsPage) ||
                (item.id === "settings" && isSettingsPage);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-snouno-dark shadow-[0_8px_20px_rgba(245,158,11,0.25)]"
                      : "text-neutral-300 hover:bg-white/8 hover:text-white"
                  } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                >
                  <Icon size={18} className="shrink-0" />
                  {(!sidebarCollapsed || mobileMenuOpen) && (
                    <span className="flex-1 text-right truncate">{item.label}</span>
                  )}
                  {(!sidebarCollapsed || mobileMenuOpen) && item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? "bg-snouno-dark text-amber-400" : "bg-white/10 text-neutral-300")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Management Shortcuts */}
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="px-3 pt-4 border-t border-amber-500/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-3 py-1 block tracking-widest">
                أدوات البيانات
              </span>

              {onOpenPaymentMethods && (
                <button
                  onClick={() => {
                    onOpenPaymentMethods();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-white/8 hover:text-white transition-all cursor-pointer"
                >
                  <FiDollarSign size={16} className="text-amber-400 shrink-0" />
                  <span>طرق الدفع</span>
                </button>
              )}

              {onExportExcel && (
                <button
                  onClick={onExportExcel}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-white/8 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <FiUpload size={16} className="text-emerald-400 shrink-0" />
                  <span>تصدير Excel</span>
                </button>
              )}

              {onImportExcel && (
                <button
                  onClick={onImportExcel}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-white/8 hover:text-blue-400 transition-all cursor-pointer"
                >
                  <FiDownload size={16} className="text-blue-400 shrink-0" />
                  <span>استيراد Excel</span>
                </button>
              )}

              {onExportJSON && (
                <button
                  onClick={onExportJSON}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-white/8 hover:text-amber-400 transition-all cursor-pointer"
                >
                  <FiDatabase size={16} className="text-amber-400 shrink-0" />
                  <span>نسخة احتياطية (JSON)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Bottom / Footer Actions (Pinned at bottom) */}
        <div className="p-3 border-t border-amber-500/15 space-y-2 shrink-0 bg-snouno-dark z-10">
          {/* Live Menu Link */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 text-amber-400 hover:bg-amber-500 hover:text-snouno-dark transition-all text-xs font-bold ${
              sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""
            }`}
          >
            <FiExternalLink size={16} className="shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>معاينة المنيو المباشر</span>}
          </a>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-red-500/15 transition-all text-xs font-bold cursor-pointer ${
                sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""
              }`}
            >
              <FiLogOut size={16} className="shrink-0" />
              {(!sidebarCollapsed || mobileMenuOpen) && <span>تسجيل الخروج</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN WRAPPER & TOP NAVBAR
          ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-amber-500/10 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-snouno-cream border border-amber-500/20 text-snouno-dark hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
              aria-label="فتح القائمة"
            >
              <FiMenu size={20} />
            </button>

            {/* Page Title & Breadcrumb */}
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-neutral-900 leading-tight">
                {title}
              </h1>
              <span className="text-[11px] text-neutral-400 font-medium hidden sm:block">
                {subtitle}
              </span>
            </div>
          </div>

          {/* Navbar Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Order System Status Pill — Clickable Toggle */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                isOrderActive
                  ? "bg-emerald-50/80 border-emerald-500/30 text-emerald-700 hover:bg-emerald-100"
                  : "bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200"
              }`}
              title="انقر لتبديل حالة نظام الطلبات"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOrderActive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-neutral-400"
                }`}
              />
              <span className="text-xs font-bold hidden sm:inline">
                {isOrderActive ? "نظام الطلبات مفعل" : "نظام الطلبات معطل"}
              </span>
            </div>

            {/* Settings Quick Link */}
            <button
              onClick={() => { navigate('/admin/settings'); }}
              className="w-10 h-10 rounded-xl bg-snouno-cream border border-amber-500/15 text-neutral-700 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
              title="إعدادات النظام"
            >
              <FiSettings size={18} />
            </button>

            {/* Quick Live Site Button */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-snouno-dark text-amber-400 font-bold text-xs border border-amber-500/30 hover:bg-amber-500 hover:text-snouno-dark transition-all"
            >
              <FiExternalLink size={14} />
              <span>الموقع</span>
            </a>
          </div>
        </header>

        {/* Top Quick Stats Row (AdminLTE Dashboard Style) */}
        {stats && (
          <div className="p-3 sm:p-5 pb-0 grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3 rounded-xl bg-white border border-amber-500/12 shadow-xs flex items-center justify-between transition-transform hover:-translate-y-0.5">
              <div>
                <span className="text-xs font-bold text-neutral-400 block">إجمالي الأقسام</span>
                <span className="text-xl font-black text-snouno-dark">{stats.categoriesCount ?? 0}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                <FiLayout size={18} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-amber-500/12 shadow-xs flex items-center justify-between transition-transform hover:-translate-y-0.5">
              <div>
                <span className="text-xs font-bold text-neutral-400 block">إجمالي المنتجات</span>
                <span className="text-xl font-black text-snouno-dark">{stats.itemsCount ?? 0}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                <FiPackage size={18} />
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 p-3 rounded-xl bg-white border border-amber-500/12 shadow-xs flex items-center justify-between transition-transform hover:-translate-y-0.5">
              <div>
                <span className="text-xs font-bold text-neutral-400 block">حالة نظام الطلبات</span>
                <span className={`text-base font-black ${isOrderActive ? "text-emerald-600" : "text-neutral-500"}`}>
                  {isOrderActive ? "استقبال طلبات" : "عرض فقط"}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-snouno-dark text-amber-400 flex items-center justify-center font-black">
                <FiSettings size={18} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
