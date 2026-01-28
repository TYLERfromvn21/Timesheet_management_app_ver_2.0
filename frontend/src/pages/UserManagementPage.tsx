import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function UserManagementPage() {
    const navigate = useNavigate();
    
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [filterDept, setFilterDept] = useState('all');
    
    // Modal Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('token');
            if(!token) return navigate('/login');

            try {
                const resMe = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(resMe.ok) {
                    const user = await resMe.json();
                    setCurrentUser(user);
                    loadData();
                } else navigate('/login');
            } catch(e) { navigate('/login'); }
        };
        init();
    }, []);

    const loadData = async () => {
        const resDept = await fetch('http://localhost:3000/api/departments');
        setDepartments(await resDept.json());
        const resUsers = await fetch('http://localhost:3000/api/users/all');
        setUsers(await resUsers.json());
    };

    const handleUpdate = async () => {
        await fetch('http://localhost:3000/api/users/update', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(editForm)
        });
        setIsEditOpen(false);
        loadData();
        alert("Cập nhật thành công!");
    };

    const handleDelete = async (id: string) => {
        if(confirm("Xóa tài khoản này? Dữ liệu cũ vẫn còn nhưng không thể đăng nhập.")) {
            await fetch('http://localhost:3000/api/users/delete', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id })
            });
            loadData();
        }
    };

    // --- YÊU CẦU 8: LOGIC LỌC USER ---
    const filteredUsers = users.filter(u => {
        if (!currentUser) return false;
        // 1. Admin Tổng: Xem hết (hoặc lọc theo dropdown)
        if (currentUser.role === 'admin_total') {
            return filterDept === 'all' ? true : u.departmentId === filterDept;
        }
        // 2. Admin Phòng ban: CHỈ xem user thuộc phòng mình
        if (currentUser.role === 'admin_dept') {
            return u.departmentId === currentUser.department; 
        }
        return false;
    });

    return (
        <div className="dashboard-body" style={{padding: '20px', overflowY: 'auto'}}>
            <div style={{maxWidth: '1000px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
                <button onClick={() => navigate('/dashboard')} className="btn-action" style={{width: 'auto', marginBottom: '15px', display: 'inline-block'}}>← Quay lại Dashboard</button>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h1 style={{color: '#b22222', margin: 0}}>QUẢN LÝ TÀI KHOẢN</h1>
                    <button onClick={() => navigate('/admin-create')} className="btn-action" style={{width: 'auto', background:'#2ecc71'}}>+ Tạo mới</button>
                </div>

                {/* Chỉ Admin Tổng mới thấy bộ lọc */}
                {currentUser?.role === 'admin_total' && (
                    <div style={{marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '4px'}}>
                        <label style={{fontWeight: 'bold', marginRight: '10px'}}>Lọc theo phòng:</label>
                        <select onChange={(e) => setFilterDept(e.target.value)} style={{padding: '5px'}}>
                            <option value="all">-- Tất cả --</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                )}

                <table className="job-table" style={{marginTop: '20px'}}>
                    <thead>
                        <tr>
                            <th>Tên đăng nhập</th>
                            <th>Vai trò</th>
                            <th>Phòng ban</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td><b>{u.username}</b></td>
                                <td>{u.role}</td>
                                <td>{u.department}</td>
                                <td>
                                    <button onClick={() => { setEditForm({id: u.id, username: u.username, password: ''}); setIsEditOpen(true); }} style={{marginRight: '5px', cursor:'pointer', border:'1px solid #ccc', padding:'2px 5px', borderRadius:'3px'}}>✏️ Sửa</button>
                                    {u.role !== 'admin_total' && (
                                        <button onClick={() => handleDelete(u.id)} style={{color: 'white', background:'red', border:'none', padding:'2px 5px', borderRadius:'3px', cursor:'pointer'}}>🗑 Xóa</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '350px'}}>
                        <h3>Cập nhật tài khoản</h3>
                        <div className="form-group">
                            <label>Tên đăng nhập</label>
                            <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới (Để trống nếu không đổi)</label>
                            <div style={{position: 'relative'}}>
                                <input type={showPassword ? "text" : "password"} placeholder="******" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                                <span onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: 10, top: 10, cursor: 'pointer'}}>👁️</span>
                            </div>
                        </div>
                        <div style={{textAlign: 'right', marginTop: '15px'}}>
                            <button onClick={() => setIsEditOpen(false)} style={{padding: '8px 15px', marginRight: '5px'}}>Hủy</button>
                            <button onClick={handleUpdate} className="btn-action" style={{width: 'auto'}}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}