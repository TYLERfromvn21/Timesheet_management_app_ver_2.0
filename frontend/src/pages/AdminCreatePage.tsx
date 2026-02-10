// frontend/src/pages/AdminCreatePage.tsx
// This file implements the AdminCreatePage component which allows for the creation of new user accounts.
// and handles different user roles and form states based on the current user's permissions.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateUserForm } from '../components/admin/CreateUserForm';
import { useAuthStore } from '../store/authStore';
import '../styles/admin-create.css';

export default function AdminCreatePage() {
    const navigate = useNavigate();
    const { logout, checkAuth } = useAuthStore();
    
    // Check if the current session is temporary (meaning the user is creating their first permanent account)
    const isTempSession = localStorage.getItem('tempAuth') === 'true';

    useEffect(() => {
        checkAuth();
    }, []);

    const handleBack = () => {
        if (isTempSession) {
            logout(); 
            navigate('/login');
        } else {
            navigate('/admin/users');
        }
    };

    return (
        <div className="create-body">
            <div style={{maxWidth: '500px', margin: '0 auto', paddingTop: '50px'}}>
                {/* Form create user */}
                <CreateUserForm 
                    isFlow1={false} // always false in admin create page
                    onSuccess={() => {
                        if (isTempSession) {
                            alert("Đã tạo tài khoản. Đang đăng xuất...");
                            logout();
                            navigate('/login');
                        } else {
                            navigate('/admin/users');
                        }
                    }}
                />

                <div className="note" style={{marginTop:'20px', textAlign: 'center', background: 'white', padding: '10px', borderRadius: '4px'}}>
                     <a onClick={handleBack} style={{color: isTempSession ? '#666' : '#b22222', cursor:'pointer', textDecoration: 'underline', fontWeight:'bold'}}>
                        {isTempSession ? "← Hủy & Quay lại Đăng nhập" : "← Quay lại Danh sách"}
                    </a>
                </div>
            </div>
        </div>
    );
}