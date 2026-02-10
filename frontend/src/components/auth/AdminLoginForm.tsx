// frontend/src/components/auth/AdminLoginForm.tsx
// this file contains the admin login form component with first-run setup
// and includes fixes for error handling and TypeScript issues

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useNavigate } from 'react-router-dom';
import { CreateUserForm } from '../admin/CreateUserForm'; 
import '../../styles/admin-auth.css';

export const AdminLoginForm = () => {
    const navigate = useNavigate();
    const adminLogin = useAuthStore(state => state.adminLogin); 
    
    // use user store to fetch users and check if any exist
    const { fetchUsers, users } = useUserStore();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // State for setup mode (when no users exist    )
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [checkingSystem, setCheckingSystem] = useState(true);

    // check on mount if any users exist to determine setup mode
    useEffect(() => {
        const checkSystem = async () => {
            try {
                //try to fetch users
                // if no users, we are in setup mode (meaning first run)
                await fetchUsers();
                
                // take current users from store
                const currentUsers = useUserStore.getState().users;
                
                if (currentUsers.length === 0) {
                    setIsSetupMode(true); // setup mode
                }
            } catch (e) {
                // if error occurs, assume system is fine
                console.log("System verified (users likely exist)");
            } finally {
                setCheckingSystem(false);
            }
        };
        checkSystem();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            await adminLogin(formData.username, formData.password);
            navigate('/admin-create'); 
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Đăng nhập thất bại';
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingSystem) return <div style={{textAlign:'center', marginTop:'50px', color:'#666'}}>Đang kiểm tra hệ thống...</div>;

    // if in setup mode, show create first admin form
    if (isSetupMode) {
        return (
            <div className="auth-card" style={{maxWidth: '500px'}}>
                <CreateUserForm 
                    isFlow1={true} 
                    onSuccess={() => {
                        alert("Chúc mừng! Bạn đã tạo Admin Tổng đầu tiên.\nVui lòng đăng nhập để tiếp tục.");
                        setIsSetupMode(false); // exit setup mode back to login
                        window.location.reload();
                    }} 
                />
            </div>
        );
    }

    //form for admin login
    return (
        <div className="auth-card">
            <h2 className="auth-h2">ĐĂNG NHẬP QUẢN TRỊ</h2>
            <p style={{color:'#666', fontSize:'0.9em', marginBottom:'20px'}}>
                Vui lòng xác minh danh tính để vào trang quản lý tài khoản.
            </p>
            
            <form onSubmit={handleLogin}>
                <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="Tên đăng nhập Admin" 
                    required 
                    value={formData.username} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
                <input 
                    type="password" 
                    className="auth-input" 
                    placeholder="Mật khẩu" 
                    required 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
            </form>
            
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            <a href="/login" className="auth-back-link">← Quay lại trang chủ</a>
        </div>
    );
};