// frontend/src/components/admin/UserManagement.tsx
// this file contains the user management component for admin users
// and includes fixes for filtering users by department and displaying department names
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { CreateUserForm } from './CreateUserForm';
import '../../styles/dashboard.css';

export const UserManagement = () => {
    const navigate = useNavigate();
    const { users, departments, fetchUsers, fetchDepartments, deleteUser, updateUser, isLoading } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [filterDept, setFilterDept] = useState('all');
    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    //fetch users and departments on mount
    useEffect(() => {
        fetchUsers();
        if (currentUser?.role === 'admin_total') {
            fetchDepartments();
        }
    }, []);

    //filter users based on role and department
    const filteredUsers = users.filter(u => {
        // 1. Admin total
        if (currentUser?.role === 'admin_total') {
            if (filterDept !== 'all') return u.departmentId === filterDept; 
            return true;
        }
        
        // 2. Admin Dept 
        if (currentUser?.role === 'admin_dept') {
            const myDeptId = currentUser.departmentId || 
                (currentUser.department && typeof currentUser.department === 'object' ? (currentUser.department as any).id : currentUser.department);
            

            const userDeptId = u.departmentId || 
                (u.department && typeof u.department === 'object' ? (u.department as any).id : u.department);

            // check if user's department matches admin's department
            return String(userDeptId) === String(myDeptId);
        }
        return false;
    });

    //function to get department name directly ( need update when have many data!!)
    const getDeptNameDirect = (u: any) => {
        // assume u.department can be object, string (name), or id
        if (u.department && typeof u.department === 'object' && u.department.name) {
            return u.department.name;
        }
        // assume u.department is string (name)
        if (typeof u.department === 'string') {
             // if string is short or has spaces, assume it's a name
             if (u.department.length < 20 || u.department.includes(' ')) return u.department;
        }
        
        // assume u.department is id, find in departments list
        if (departments.length > 0) {
            const idToFind = u.departmentId || u.department; // find by departmentId or department field
            const d = departments.find(dept => dept.id === idToFind);
            if (d) return d.name;
        }

        // Fallback
        return u.department || '-';
    };

    //function to handle delete user
    const handleDelete = async (id: string) => {
        if (window.confirm('Xóa tài khoản này?')) {
            try { await deleteUser(id); alert('Đã xóa!'); } catch (err) { alert('Lỗi xóa'); }
        }
    };

    //function to open edit modal
    const openEditModal = (user: any) => {
        setEditForm({ id: user.id, username: user.username, password: '' });
        setIsEditOpen(true);
    };

    //function to handle update user
    const handleUpdate = async () => {
        try {
            const payload: any = { username: editForm.username };
            if (editForm.password.trim()) payload.password = editForm.password;
            await updateUser(editForm.id, payload);
            alert('Cập nhật thành công!');
            setIsEditOpen(false);
        } catch (err) { alert('Lỗi cập nhật'); }
    };

    return (
        <div className="admin-content-card" style={{background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <button onClick={() => navigate('/dashboard')} style={{background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold'}}>← Về Dashboard</button>
                    <h2 style={{margin: 0, color: '#b22222', textTransform: 'uppercase', fontSize: '1.2rem'}}>
                        {viewMode === 'list' ? 'Danh sách nhân sự' : 'Thêm nhân sự mới'}
                    </h2>
                </div>
                {(currentUser?.role === 'admin_total' || currentUser?.role === 'admin_dept') && (
                    <button 
                        onClick={() => setViewMode(viewMode === 'list' ? 'create' : 'list')}
                        style={{padding: '8px 16px', background: viewMode === 'list' ? '#b22222' : '#666', color: 'white', border: 'none', borderRadius: '4px', cursor:'pointer', fontWeight: 'bold'}}
                    >
                        {viewMode === 'list' ? '+ Thêm Mới' : '← Quay lại Danh sách'}
                    </button>
                )}
            </div>

            {viewMode === 'create' ? (
                <div style={{maxWidth: '500px', margin: '0 auto'}}>
                    <CreateUserForm isFlow1={false} onSuccess={() => { fetchUsers(); setViewMode('list'); }} />
                </div>
            ) : (
                <>
                    {/* Only admin total see */}
                    {currentUser?.role === 'admin_total' && (
                        <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <label style={{fontWeight: 'bold'}}>Lọc theo phòng ban:</label>
                            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{padding: '6px', borderRadius: '4px', border: '1px solid #ccc'}}>
                                <option value="all">-- Tất cả --</option>
                                {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                            </select>
                        </div>
                    )}

                    <div style={{overflowX: 'auto'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem'}}>
                            <thead>
                                <tr style={{background: '#f8f9fa', borderBottom: '2px solid #ddd', textAlign: 'left'}}>
                                    <th style={{padding: '12px'}}>Tên đăng nhập</th>
                                    <th style={{padding: '12px'}}>Phòng ban</th>
                                    <th style={{padding: '12px'}}>Vai trò</th>
                                    <th style={{padding: '12px', textAlign: 'center'}}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? ( <tr><td colSpan={4} style={{textAlign:'center', padding:'20px'}}>Đang tải...</td></tr> ) 
                                : filteredUsers.length === 0 ? ( <tr><td colSpan={4} style={{textAlign:'center', padding:'20px', color: '#888'}}>Không tìm thấy nhân viên nào</td></tr> ) 
                                : (
                                    filteredUsers.map(u => (
                                        <tr key={u.id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{padding: '12px', fontWeight: '500'}}>{u.username}</td>
                                            
                                            {/* Display department name */}
                                            <td style={{padding: '12px'}}>{getDeptNameDirect(u)}</td>
                                            
                                            <td style={{padding: '12px'}}>
                                                <span style={{padding: '2px 8px', borderRadius: '10px', fontSize: '0.85em', background: '#eee'}}>
                                                    {u.role === 'admin_total' ? 'Admin Tổng' : (u.role === 'admin_dept' ? 'QL Phòng' : 'Nhân viên')}
                                                </span>
                                            </td>
                                            <td style={{padding: '12px', textAlign: 'center'}}>
                                                {currentUser?.id !== u.id && (
                                                    <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
                                                        <button onClick={() => openEditModal(u)} style={{border: '1px solid #2196f3', color: '#2196f3', background: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>✎</button>
                                                        <button onClick={() => handleDelete(u.id)} style={{border: '1px solid #d32f2f', color: '#d32f2f', background: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>🗑</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isEditOpen && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-content" style={{width: '400px'}} onClick={e => e.stopPropagation()}>
                        <h3>Cập nhật tài khoản</h3>
                        <div className="form-group">
                            <label>Tên đăng nhập</label>
                            <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input type={showPassword ? "text" : "password"} placeholder="******" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} />
                        </div>
                        <div style={{textAlign: 'right', marginTop: '20px'}}>
                            <button onClick={() => setIsEditOpen(false)} style={{marginRight: '10px'}}>Hủy</button>
                            <button onClick={handleUpdate}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};