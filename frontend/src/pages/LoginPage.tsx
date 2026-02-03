// frontend/src/pages/LoginPage.tsx
// This file is the React component for the Login Page. It handles user login, including form state management,
// API calls to the backend, and displaying messages to the user.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css'; 

export default function LoginPage() {
    // --- 1. STATE MANAGEMENT ---
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // State hide/show password
    const [showPassword, setShowPassword] = useState(false);

    // State message show error/success
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // --- 2. LOGIC HANDLERS ---

    // function to parse URL parameters for messages
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get('error');
        const successMsg = params.get('message');

        if (errorMsg) setMessage({ type: 'error', text: decodeURIComponent(errorMsg) });
        if (successMsg) setMessage({ type: 'success', text: decodeURIComponent(successMsg) });
    }, []);

    // function to handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    //function to handle form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setMessage(null); 

        try {
            // call login API
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            // LoginPage.tsx - handleLogin function 
if (res.ok) {
    setMessage({ type: 'success', text: 'Đăng nhập thành công! Đang chuyển hướng...' });
    
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    
    // Clear tempAuth flag if it exists (in case user was in Flow 1)
    localStorage.removeItem('tempAuth');

    setTimeout(() => {
        navigate('/dashboard');
    }, 1000);
} else {
                
                setMessage({ type: 'error', text: data.message || 'Đăng nhập thất bại' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Không thể kết nối tới Server Backend!' });
        }
    };

    // function to handle admin login redirection
    const handleAdminLogin = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/check-system-status');            const data = await res.json();
            
            if (data.isSetupMode) {
                window.location.href = '/admin-create';
            } else {
                window.location.href = '/admin-auth';
            }
        } catch (e) {
            alert("Lỗi kết nối Server! Đảm bảo Backend đã chạy ở port 3000");
        }
    };

    // --- 3. RENDERING ---
    return (
        <div className="login-container">
            {/* Left Panel: Branding */}
            <div className="left-panel">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <h2 style={{ fontSize: '3em', margin: 0 }}>TÍN VIỆT</h2>
                <p style={{ opacity: 0.8 }}>Hệ thống quản lý Timesheet</p>
            </div>

            {/* Right Panel: Login Form */}
            <div className="right-panel">
                <div className="login-box">
                    <h1>Đăng nhập</h1>
                    
                    <form onSubmit={handleLogin}>
                        {/* Username Input */}
                        <div className="form-group">
                            <label>Tên đăng nhập</label>
                            <input 
                                type="text" 
                                name="username" 
                                required 
                                placeholder="Nhập username..."
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="form-group">
                            <label>Mật khẩu</label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                name="password" 
                                required 
                                placeholder="Nhập mật khẩu..." 
                                style={{ paddingRight: '40px' }}
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="eye-icon"
                                role="button"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="btn-login">ĐĂNG NHẬP</button>

                        {/* Extra Links */}
                        <div className="extra-links">
                            <span>Chưa có tài khoản? Liên hệ quản lý.</span>
                            <span 
                                onClick={handleAdminLogin} 
                                className="btn-admin"
                            >
                                Admin log in
                            </span>
                        </div>
                    </form>

                    {message && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}