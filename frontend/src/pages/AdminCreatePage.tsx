import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin-create.css';

interface Department { id: string; code: string; name: string; }

export default function AdminCreatePage() {
    const navigate = useNavigate();
    const [pageTitle, setPageTitle] = useState("TẠO TÀI KHOẢN MỚI");
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // --- CHECK FLOW ---
    const isFlow1 = localStorage.getItem('tempAuth') === 'true';

    const [formData, setFormData] = useState({
        username: '', password: '', role: 'admin_total', departmentId: ''
    });
    
    // User State for role-based form adjustments
    const [currentUser, setCurrentUser] = useState<any>(null);

    // --- 1. Load Data ---
    useEffect(() => {
        if (isFlow1) setPageTitle("KHỞI TẠO TÀI KHOẢN (Admin Login)");

        const init = async () => {
            // Load Departments
            try {
                const deptRes = await fetch('http://localhost:3000/api/departments');
                setDepartments(await deptRes.json());
            } catch (e) {}

            // Check Auth
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            try {
                const res = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const user = await res.json();
                    setCurrentUser(user);

                    // basic form setup
                    if (user.role === 'admin_dept') {
                        setFormData(prev => ({ 
                            ...prev, 
                            role: 'user', 
                            departmentId: user.department 
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, role: 'admin_total' }));
                    }
                } else {
                    navigate('/login');
                }
            } catch (err) {
                navigate('/login');
            }
        };
        init();
    }, [navigate, isFlow1]);

    const showDept = formData.role !== 'admin_total';
    const isDeptLocked = currentUser?.role === 'admin_dept';

    // --- 2. Handle Submit & Navigate ---
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
                setTimeout(() => {
                    if (isFlow1) {
                        localStorage.clear(); // delete token admin
                        navigate('/login');
                    } else {
                        navigate('/admin/users');
                    }
                }, 1500);
                
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
                
                {message && <span className={message.type === 'error' ? 'msg-error' : 'msg-success'}>{message.text}</span>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên đăng nhập</label>
                        <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    
                    <div className="form-group">
                        <label>Loại tài khoản</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            {!currentUser ? (
                                <option value="admin_total">Admin Tổng (First Run)</option>
                            ) : currentUser.role === 'admin_dept' ? (
                                <option value="user">Nhân viên</option>
                            ) : (
                                <>
                                    <option value="admin_total">Admin Tổng</option>
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
                
                {/* --- FOOTER LINKS --- */}
                <div className="note" style={{marginTop:'20px', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                    {isFlow1 ? (
                        <a onClick={() => { localStorage.clear(); navigate('/login'); }} style={{color:'#666', cursor:'pointer'}}>
                            ← Hủy & Quay lại Đăng nhập
                        </a>
                    ) : (
                        <a onClick={() => navigate('/admin/users')} style={{color:'#b22222', cursor:'pointer'}}>
                            ← Quay lại Quản lý tài khoản
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}