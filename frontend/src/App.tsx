import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { frm_TrangChu as FrmTrangChu } from '@/pages/frm_TrangChu';
import { frm_ChiTietLinhKien as FrmChiTietLinhKien } from '@/pages/frm_ChiTietLinhKien';
import { frm_GioHang as FrmGioHang } from '@/pages/frm_GioHang';
import { frm_ThanhToan as FrmThanhToan } from '@/pages/frm_ThanhToan';
import { frm_DashboardIoT as FrmDashboardIoT } from '@/pages/frm_DashboardIoT';
import { frm_TuVanAI as FrmTuVanAI } from '@/pages/frm_TuVanAI';
import { frm_PCBuilder as FrmPCBuilder } from '@/pages/frm_PCBuilder';
import { frm_AdminQuanTri as FrmAdminQuanTri } from '@/pages/frm_AdminQuanTri';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { MyOrdersPage } from '@/pages/MyOrdersPage';
import { OrderTrackingPage } from '@/pages/OrderTrackingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/dang-nhap" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const canAccess = useAuthStore((s) => s.canAccessAdminPanel());
  if (!canAccess) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Toaster position="top-right" richColors theme="dark" />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* 8 Form Routes of the Thesis */}
          <Route path="/" element={<FrmTrangChu />} />
          <Route path="/danh-muc/:slug" element={<FrmTrangChu />} />
          <Route path="/san-pham/:slug" element={<FrmChiTietLinhKien />} />
          <Route path="/gio-hang" element={<FrmGioHang />} />
          <Route path="/thanh-toan" element={<FrmThanhToan />} />
          <Route path="/iot" element={<FrmDashboardIoT />} />
          <Route path="/tu-van-ai" element={<FrmTuVanAI />} />
          <Route path="/pc-builder" element={<FrmPCBuilder />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <FrmAdminQuanTri />
              </AdminRoute>
            }
          />

          {/* Extra Auth & Order Routes */}
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route
            path="/don-hang"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/tra-cuu" element={<OrderTrackingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};
