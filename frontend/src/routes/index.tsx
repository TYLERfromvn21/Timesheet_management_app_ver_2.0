// src/routes/index.tsx
// this file defines the routing for the React application
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage"; 
import AdminAuthPage from "../pages/AdminAuthPage";   
import AdminCreatePage from "../pages/AdminCreatePage"; 
import DashboardPage from "../pages/DashboardPage";
import UserManagementPage from "../pages/UserManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />, // Redirect to LoginPage by default
  },
  {
    path: "/login", // Redirect to LoginPage
    element: <LoginPage />,
  },
  {
    path: "/admin", // Redirect to AdminPage for admin dashboard
    element: <AdminPage />,
  },
  {
    path: "/admin-auth",   // Redirect to AdminAuthPage for admin authentication
    element: <AdminAuthPage />,
  },
  {
    path: "/admin-create", // Redirect to AdminCreatePage for admin account creation
    element: <AdminCreatePage />,
  },
  {
    path: "/dashboard", // Redirect to DashboardPage after successful login
    element: <DashboardPage />,
  },
  {
    path: "/admin/users", // Redirect to UserManagementPage for managing users
    element: <UserManagementPage />,
  },

]);