// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage"; // Import trang Admin
import AdminAuthPage from "../pages/AdminAuthPage";   // <-- Mới
import AdminCreatePage from "../pages/AdminCreatePage"; // <-- Mới
import DashboardPage from "../pages/DashboardPage";
import UserManagementPage from "../pages/UserManagementPage";
// Sau này sẽ import thêm Dashboard, Timesheet... ở đây

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />, // Mặc định vào trang Login
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin", // Đường dẫn truy cập
    element: <AdminPage />,
  },
  {
    path: "/admin-auth",   // Link vào trang xác thực admin
    element: <AdminAuthPage />,
  },
  {
    path: "/admin-create", // Link vào trang tạo tài khoản
    element: <AdminCreatePage />,
  },
  {
    path: "/dashboard", // <--- Đây là địa chỉ mà trang Login đang cố chuyển tới
    element: <DashboardPage />,
  },
  {
    path: "/admin/users", // <--- Route mới cho quản lý tài khoản
    element: <UserManagementPage />,
  },
  // Sau này sẽ thêm các route khác:
  // { path: "/dashboard", element: <DashboardPage /> }
]);