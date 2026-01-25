import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';

interface Department {
    id: string;
    code: string;
    name: string;
}

export default function AdminPage() {
    const navigate = useNavigate();

    // --- STATE (Tương đương các biến trong script cũ) ---
    const [departments, setDepartments] = useState<Department[]>([]);
    const [pageTitle, setPageTitle] = useState("TẠO TÀI KHOẢN");
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: '', // thay cho 'type'
        departmentId: '' // thay cho 'department'
    });

    // Thông tin người tạo (Lấy từ localStorage thay vì gọi API /user-info)
    const [currentUser, setCurrentUser] = useState<{ role: string, departmentId: string } | null>(null);

    // --- 1. Window Onload Logic (Khởi tạo trang) ---
    useEffect(() => {
        const initPage = async () => {
            await loadDepartments();
            
            try {
                // Check system status (Setup Mode)
                const resStatus = await fetch('http://localhost:3000/api/auth/check-system-status');
                const statusData = await resStatus.json();

                if (statusData.isSetupMode) {
                    // Scenario: Setup Mode
                    setPageTitle("KHỞI TẠO ADMIN TỔNG");
                    // Tự set role là Admin Tổng
                    setFormData(prev => ({ ...prev, role: 'admin_total' }));
                } else {
                    // Scenario: Authenticated Mode
                    // Lấy thông tin user đang đăng nhập từ localStorage
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        // Convert role backend (ADMIN_TOTAL) sang format của form (admin_total) nếu cần khớp logic cũ
                        // Ở đây ta giả định backend trả về đúng chuẩn
                        setCurrentUser({
                            role: user.role.toLowerCase(), // Chuyển về chữ thường để khớp logic cũ
                            departmentId: user.departmentId
                        });

                        // Set mặc định role user dựa trên quyền người tạo
                        if (user.role === 'ADMIN_DEPT') {
                             setFormData(prev => ({ ...prev, role: 'user' }));
                        }
                    } else {
                        // Chưa đăng nhập -> đá về Login
                        navigate('/');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        initPage();
    }, [navigate]);

    // --- 2. Load Departments ---
    const loadDepartments = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/departments');
            const data = await res.json();
            setDepartments(data);
        } catch (e) {
            console.error("Error loading departments");
        }
    };

    // --- 3. Handle Form Change ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // --- 4. Logic hiển thị/ẩn/khóa Department (Hàm toggleDept cũ) ---
    // React xử lý việc này bằng biến render chứ không DOM trực tiếp
    const renderDepartmentSelect = () => {
        // Nếu là Admin Tổng (đang tạo) -> Ẩn
        if (formData.role === 'admin_total') return null;

        // Nếu người tạo là Admin Dept -> Khóa và tự điền phòng của họ
        const isCreatorAdminDept = currentUser?.role === 'admin_dept';
        
        // Giá trị select: Nếu là Admin Dept tạo thì lấy phòng của họ, còn không lấy từ form
        const selectedValue = isCreatorAdminDept ? currentUser?.departmentId : formData.departmentId;

        return (
            <div className="form-group" id="deptGroup">
                <label>Phòng ban</label>
                <select 
                    name="departmentId" 
                    id="department"
                    value={selectedValue || ""}
                    onChange={handleChange}
                    disabled={isCreatorAdminDept} // Khóa nếu là Admin Dept
                    required={!isCreatorAdminDept} // Bắt buộc nếu được chọn
                >
                    <option value="">-- Chọn --</option>
                    {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option> // Backend dùng ID, frontend cũ dùng Code. Ta dùng ID cho chuẩn.
                    ))}
                </select>
            </div>
        );
    };

    // --- 5. Submit Form ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Logic validateForm cũ
        if (formData.role !== 'admin_total') {
            const isCreatorAdminDept = currentUser?.role === 'admin_dept';
            if (!isCreatorAdminDept && !formData.departmentId) {
                setMessage({ type: 'error', text: "Vui lòng chọn phòng ban!" });
                return;
            }
        }

        // Chuẩn bị dữ liệu gửi đi
        const submitData = {
            ...formData,
            // Nếu là Admin Dept tạo, force departmentId là của họ
            departmentId: currentUser?.role === 'admin_dept' ? currentUser.departmentId : formData.departmentId
        };

        try {
            const res = await fetch('http://localhost:3000/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                // Reset form (giữ lại role)
                setFormData(prev => ({ ...prev, username: '', password: '' }));
            } else {
                setMessage({ type: 'error', text: data.message || "Lỗi tạo tài khoản" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Lỗi kết nối Server!" });
        }
    };

    return (
        <div className="admin-wrapper">
            <div className="admin-card">
                <h1 className="admin-h1" id="pageTitle">{pageTitle}</h1>
                
                {message && (
                    <div className={`msg-box ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input 
                            type="text" 
                            name="username" 
                            required 
                            placeholder="VD: ketoan01"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            id="regPass" 
                            required 
                            placeholder="******" 
                            style={{ paddingRight: '40px' }}
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">👁️</span>
                    </div>

                    <div className="form-group">
                        <label>Loại tài khoản</label>
                        <select 
                            id="type" 
                            name="role" 
                            onChange={handleChange} 
                            value={formData.role}
                        >
                            {/* Logic render option dựa trên quyền người tạo */}
                            {!currentUser || pageTitle.includes("KHỞI TẠO") ? (
                                <option value="admin_total">Admin Tổng (Quản trị viên)</option>
                            ) : (
                                <>
                                    {currentUser.role === 'admin_total' && (
                                        <>
                                            <option value="">-- Chọn --</option>
                                            <option value="admin_dept">Quản lý Phòng ban</option>
                                            <option value="user">Nhân viên</option>
                                            <option value="admin_total">Admin Tổng (Phụ)</option>
                                        </>
                                    )}
                                    {currentUser.role === 'admin_dept' && (
                                        <option value="user">Nhân viên</option>
                                    )}
                                </>
                            )}
                        </select>
                    </div>

                    {/* Department Select (Dynamic) */}
                    {renderDepartmentSelect()}

                    <button type="submit" className="admin-btn">Tạo Tài Khoản</button>
                </form>

                {!pageTitle.includes("KHỞI TẠO") && (
                    <div className="note" id="loginLink">
                        <a href="/" style={{ color: '#b22222', textDecoration: 'none' }}>Quay lại Đăng nhập</a>
                    </div>
                )}
            </div>
        </div>
    );
}