import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin-create.css';

interface Department {
    id: string;
    code: string;
    name: string;
}

export default function AdminCreatePage() {
    const navigate = useNavigate();
    const [pageTitle, setPageTitle] = useState("KHỞI TẠO ADMIN TỔNG");
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'admin_total', // Default cho First Run
        departmentId: ''
    });

    // User State (người đang thực hiện tạo)
    const [currentUser, setCurrentUser] = useState<any>(null);

    // --- 1. Load Data lúc vào trang (Giống window.onload) ---
    useEffect(() => {
        const init = async () => {
            // Load danh sách phòng ban trước
            try {
                const deptRes = await fetch('http://localhost:3000/api/departments');
                const deptData = await deptRes.json();
                setDepartments(deptData);
            } catch (e) { console.error(e); }

            // Gọi API /me để check user info (thay vì fetch /user-info cũ)
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const user = await res.json();
                    setCurrentUser(user);

                    // CASE 1: Đã đăng nhập (Admin creating users)
                    setPageTitle("TẠO TÀI KHOẢN MỚI");
                    
                    // Logic khóa quyền Admin Dept
                    if (user.role === 'admin_dept') {
                        setFormData(prev => ({ 
                            ...prev, 
                            role: 'user', // Chỉ được tạo user
                            departmentId: user.department // Khóa vào phòng của họ
                        }));
                    } else {
                        // Admin Tổng thì mặc định chọn
                        setFormData(prev => ({ ...prev, role: 'admin_total' }));
                    }

                } else {
                    // CASE 2: Chưa đăng nhập (First Run / Token lỗi)
                    // Logic cũ: Restricts creation to 'Total Admin' only
                    setFormData(prev => ({ ...prev, role: 'admin_total' }));
                }
            } catch (err) {
                // Lỗi mạng -> Cũng coi như First Run
                setFormData(prev => ({ ...prev, role: 'admin_total' }));
            }
        };
        init();
    }, []);

    // --- 2. Logic Toggle Department (Ẩn hiện phòng ban) ---
    const showDept = formData.role !== 'admin_total';
    const isDeptLocked = currentUser?.role === 'admin_dept';

    // --- 3. Handle Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const res = await fetch('http://localhost:3000/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Tạo tài khoản thành công!' });
                setFormData(prev => ({ ...prev, username: '', password: '' })); // Reset form
                navigate('/admin-auth');
            } else {
                setMessage({ type: 'error', text: data.message || 'Lỗi tạo tài khoản' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Lỗi kết nối Server' });
        }
    };

    return (
        <div className="create-body">
            <div className="create-card">
                <h1 className="create-h1">{pageTitle}</h1>
                
                {message && (
                    <span className={message.type === 'error' ? 'msg-error' : 'msg-success'}>
                        {message.text}
                    </span>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input 
                            type="text" required placeholder="VD: admin"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input 
                            type="password" required placeholder="******"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Loại tài khoản</label>
                        <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        >
                            {/* Logic hiển thị option dựa trên quyền */}
                            {!currentUser ? (
                                <option value="admin_total">Admin Tổng (First Run)</option>
                            ) : currentUser.role === 'admin_dept' ? (
                                <option value="user">Nhân viên</option>
                            ) : (
                                <>
                                    <option value="admin_total">Admin Tổng (Quản trị viên)</option>
                                    <option value="admin_dept">Quản lý Phòng ban</option>
                                    <option value="user">Nhân viên</option>
                                </>
                            )}
                        </select>
                    </div>

                    {showDept && (
                        <div className="form-group">
                            <label>Phòng ban</label>
                            <select 
                                value={formData.departmentId}
                                onChange={e => setFormData({...formData, departmentId: e.target.value})}
                                disabled={isDeptLocked}
                                style={isDeptLocked ? { background: '#eee', pointerEvents: 'none' } : {}}
                            >
                                <option value="">-- Chọn --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="create-btn">Tạo Tài Khoản</button>
                </form>
                
                {currentUser && (
                    <div className="note">
                        <a href="/login" style={{color:'#b22222', textDecoration:'none'}}>Quay lại Đăng nhập</a>
                    </div>
                )}
            </div>
        </div>
    );
}