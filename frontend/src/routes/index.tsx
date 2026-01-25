// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage"; // Import trang Admin
import AdminAuthPage from "../pages/AdminAuthPage";   // <-- Mới
import AdminCreatePage from "../pages/AdminCreatePage"; // <-- Mới
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
  // Sau này sẽ thêm các route khác:
  // { path: "/dashboard", element: <DashboardPage /> }
]);