import { Routes, Route } from "react-router-dom";
import { AdminPage, AdminOrdersPage, AdminPromotionsPage, AdminSettingsPage, TrackOrderPage, MenuPage } from "./pages";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
      <Route path="/track-order/:id" element={<TrackOrderPage />} />

      {/* fallback */}
      <Route
        path="*"
        element={
          <div className="text-white p-10 text-center font-bold">
            الصفحة غير موجودة
          </div>
        }
      />
    </Routes>
  );
}
