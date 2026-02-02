/**
 * App routing (React Router).
 */

import { Navigate, Route, Routes } from "react-router-dom";

import { RequireActor } from "./components/RequireActor";
import { UserLayout } from "./components/UserLayout";
import { AdminLayout } from "./components/AdminLayout";
import { RequireUserProfileComplete } from "./components/RequireUserProfileComplete";

import { Home } from "./pages/Home";
import { UserLogin } from "./pages/user/Login";
import { UserRegister } from "./pages/user/Register";
import { CompleteProfilePage } from "./pages/user/CompleteProfile";
import { PackagesPage } from "./pages/user/Packages";
import { AllPackagesPage } from "./pages/user/AllPackages";
import { NewOrderPage } from "./pages/user/NewOrder";
import { OrdersPage } from "./pages/user/Orders";
import { OrderDetailPage } from "./pages/user/OrderDetail";
import { ProfilePage } from "./pages/user/Profile";

import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminOrdersPage } from "./pages/admin/AdminOrders";
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetail";
import { AdminPackagesPage } from "./pages/admin/AdminPackages";
import { AdminUsersPage } from "./pages/admin/AdminUsers";
import { AdminRevenuePage } from "./pages/admin/AdminRevenue";
import { AdminRatingsPage } from "./pages/admin/AdminRatings";

function NotFound() {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="text-lg font-semibold">Page not found</div>
      <div className="mt-1 text-sm text-slate-600">Check the URL and try again.</div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Security: Redirect /admin to Home to hide admin login URL */}
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="/admin/login" element={<Navigate to="/" replace />} />

      {/* USER auth */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />

      {/* USER app */}
      <Route
        element={
          <RequireActor actor="USER">
            <UserLayout />
          </RequireActor>
        }
      >
        {/* Onboarding: allow access even when profile is incomplete */}
        <Route path="/profile/complete" element={<CompleteProfilePage />} />

        {/* Settings/edit page always accessible */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Marketplace requires completed profile */}
        <Route element={<RequireUserProfileComplete />}>
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/all" element={<AllPackagesPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      {/* ADMIN auth */}
      <Route path="/adminlokacleanmandalika/login" element={<AdminLogin />} />

      {/* ADMIN app */}
      <Route
        element={
          <RequireActor actor="ADMIN">
            <AdminLayout />
          </RequireActor>
        }
      >
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="/admin/packages" element={<AdminPackagesPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/revenue" element={<AdminRevenuePage />} />
        <Route path="/admin/ratings" element={<AdminRatingsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}


