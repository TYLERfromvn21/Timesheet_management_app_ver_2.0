// frontend/src/components/auth/LoginForm.tsx
// this file contains the login form component with error handling
// and includes fixes for TypeScript issues
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import '../../styles/auth.css';

interface Props {
    initialMessage?: { type: 'error' | 'success', text: string } | null;
}

export const LoginForm: React.FC<Props> = ({ initialMessage }) => {
    const navigate = useNavigate();
    
    // functions from auth store to handle login and loading state
    const login = useAuthStore(state => state.login);
    const isLoading = useAuthStore(state => state.isLoading);
    
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(initialMessage);

    useEffect(() => {
        if (initialMessage) setMessage(initialMessage);
    }, [initialMessage]);

    // function to handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ 
            ...formData, 
            [e.target.name as keyof typeof formData]: e.target.value 
        });
    };

    //function to handle admin login redirection
    const handleAdminLogin = () => {
        navigate('/admin-auth');
    };

    //function to handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            await login(formData.username, formData.password);
            
            navigate('/dashboard');

        } catch (err: any) {
            console.error("Login failed:", err);
            setMessage({ type: 'error', text: err.message || 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    };

    return (
        <div className="login-form-wrapper" style={{width: '100%', maxWidth: '400px', padding: '20px'}}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input 
                        type="text" 
                        name="username"
                        placeholder="Nhập tên đăng nhập..."
                        required
                        value={formData.username}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            placeholder="Nhập mật khẩu..."
                            required
                            style={{ paddingRight: '40px' }}
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <span 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="eye-icon"
                            role="button"
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </span>
                    </div>
                </div>

                <button type="submit" className="btn-login" disabled={isLoading}>
                    {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                </button>

                <div className="extra-links">
                    <span>Chưa có tài khoản? Liên hệ quản lý.</span>
                    <span 
                        onClick={handleAdminLogin} 
                        className="btn-admin"
                        style={{ cursor: 'pointer' }}
                    >
                        Admin log in
                    </span>
                </div>
            </form>

            {message && (
                <div className={`message-box ${message.type}`} style={{marginTop: '15px'}}>
                    {message.text}
                </div>
            )}
        </div>
    );
};