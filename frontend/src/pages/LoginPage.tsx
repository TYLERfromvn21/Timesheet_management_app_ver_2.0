import React, { useState, useEffect } from 'react';
import '../styles/auth.css'; // Import giao diện đã tạo ở bước 1

export default function LoginPage() {
    // --- 1. KHAI BÁO STATE (Biến lưu trữ dữ liệu) ---
    // State lưu username và password người dùng nhập
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // State ẩn/hiện mật khẩu (thay cho hàm togglePass cũ)
    const [showPassword, setShowPassword] = useState(false);

    // State thông báo lỗi hoặc thành công
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    // --- 2. XỬ LÝ LOGIC ---

    /**
     * Hàm chạy 1 lần khi trang vừa load (giống đoạn script check URL params cũ)
     * Kiểm tra xem trên thanh địa chỉ có ?error=... hay ?message=... không
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get('error');
        const successMsg = params.get('message');

        if (errorMsg) setMessage({ type: 'error', text: decodeURIComponent(errorMsg) });
        if (successMsg) setMessage({ type: 'success', text: decodeURIComponent(successMsg) });
    }, []);

    /**
     * Hàm xử lý khi người dùng gõ phím
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    /**
     * Hàm xử lý Đăng Nhập (Thay thế cho form action="/login")
     * Kết nối tới Backend API thật
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Chặn việc load lại trang của form HTML cũ
        setMessage(null); // Xóa thông báo cũ

        try {
            // Gọi API Login của Backend (Port 3000)
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                // Đăng nhập thành công
                setMessage({ type: 'success', text: 'Đăng nhập thành công! Đang chuyển hướng...' });
                
                // Lưu token vào bộ nhớ trình duyệt
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // TODO: Chuyển hướng vào trang Dashboard sau 1 giây
                setTimeout(() => {
                    alert('Login thành công! (Sau này sẽ chuyển trang tại đây)');
                }, 1000);
            } else {
                // Đăng nhập thất bại (Sai pass/user)
                setMessage({ type: 'error', text: data.message || 'Đăng nhập thất bại' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Không thể kết nối tới Server Backend!' });
        }
    };

    /**
     * Logic xử lý Admin Login (Giữ nguyên logic cũ)
     * Kiểm tra trạng thái hệ thống trước khi chuyển trang
     */
    const handleAdminLogin = async () => {
        try {
            // Gọi API kiểm tra (Hiện tại backend chưa có API này nên sẽ báo lỗi, giữ logic để sau này làm)
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

    // --- 3. PHẦN GIAO DIỆN (JSX - Tương tự HTML cũ) ---
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
                                type={showPassword ? "text" : "password"} // Logic ẩn hiện pass
                                name="password" 
                                required 
                                placeholder="Nhập mật khẩu..." 
                                style={{ paddingRight: '40px' }}
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {/* Nút con mắt toggle pass */}
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

                    {/* Hiển thị thông báo lỗi/thành công */}
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