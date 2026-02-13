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
        // 1. SỬA: Dùng <main> thay vì <div> để máy đọc biết đây là nội dung chính
        <main className="create-body">
            <div style={{maxWidth: '500px', margin: '0 auto', paddingTop: '50px'}}>
                
                <CreateUserForm 
                    isFlow1={false} 
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

                <div className="note" style={{marginTop:'20px', textAlign: 'center', background: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                     {/* 2. SỬA: Đổi thẻ <a> thành <button> để Google không bắt lỗi thiếu href */}
                     <button 
                        onClick={handleBack} 
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            color: isTempSession ? '#666' : '#b22222', 
                            cursor:'pointer', 
                            textDecoration: 'underline', 
                            fontWeight: 'bold'
                        }}
                        // Thêm aria-label cho Accessibility
                        aria-label={isTempSession ? "Hủy tạo và quay lại đăng nhập" : "Quay lại danh sách tài khoản"}
                    >
                        {isTempSession ? "← Hủy & Quay lại Đăng nhập" : "← Quay lại Quản lý tài khoản"}
                    </button>
                </div>
            </div>
        </main>
    );
}