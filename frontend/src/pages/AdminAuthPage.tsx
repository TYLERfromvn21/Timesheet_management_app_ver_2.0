// frontend/src/pages/AdminAuthPage.tsx
// This file contains the admin authentication page component.

import React from 'react';
import { AdminLoginForm } from '../components/auth/AdminLoginForm';
import '../styles/admin-auth.css';

export default function AdminAuthPage() {
    // Component for admin authentication page
    return (
        <div className="auth-body">
            <AdminLoginForm />
        </div>
    );
}