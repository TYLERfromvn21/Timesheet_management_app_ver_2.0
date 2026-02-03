// frontend/src/pages/AdminAuthPage.tsx
// This file contains the admin authentication page component.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin-auth.css';

export default function AdminAuthPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    
    //function to handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            const res = await fetch('http://localhost:3000/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                // delete old tokens
                localStorage.clear();

                // save new token
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('tempAuth', 'true');
                
                navigate('/admin-create'); 
            } else {
                setErrorMsg(data.error || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setErrorMsg('Lỗi kết nối server');
        }
    };

    return (
        <div className="auth-body">
            <div className="auth-card">
                <h2 className="auth-h2">ĐĂNG NHẬP QUẢN TRỊ</h2>
                <p style={{color:'#666', fontSize:'0.9em', marginBottom:'20px'}}>
                    Vui lòng xác minh danh tính để vào trang quản lý tài khoản.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" className="auth-input" placeholder="Tên đăng nhập Admin" required 
                        value={username} onChange={(e) => setUsername(e.target.value)}
                    />
                    <input 
                        type="password" className="auth-input" placeholder="Mật khẩu" required 
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="auth-btn">Xác nhận</button>
                </form>
                
                {errorMsg && <div className="auth-error">{errorMsg}</div>}
                <a href="/login" className="auth-back-link">← Quay lại trang chủ</a>
            </div>
        </div>
    );
}