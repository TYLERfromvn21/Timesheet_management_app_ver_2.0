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
    const { users, departments, fetchUsers, fetchDepartments, deleteUser, updateUser } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [filterDept, setFilterDept] = useState('all');
    
    // State for Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Watch currentUser state to fetch departments safely after F5
    useEffect(() => {
        if (currentUser?.role === 'admin_total') {
            fetchDepartments();
        }
    }, [currentUser]); 

    // Logic to filter users based on current user's role and selected department
    const filteredUsers = users.filter(u => {
        if (currentUser?.role === 'admin_total') {
            if (filterDept !== 'all') return u.departmentId === filterDept || (typeof u.department === 'object' && (u.department as any)?.id === filterDept);
            return true;
        }
        if (currentUser?.role === 'admin_dept') {
            const myDeptId = currentUser.departmentId || (typeof currentUser.department === 'object' ? (currentUser.department as any).id : currentUser.department);
            return u.departmentId === myDeptId || (typeof u.department === 'object' && (u.department as any)?.id === myDeptId);
        }
        return false;
    });

    //function to get department name from user object, 
    // handling both cases where department is an object or just an ID
    const getDeptName = (u: any) => {
        if (typeof u.department === 'object' && u.department) return u.department.name;
        if (u.departmentId) {
            const d = departments.find(dept => dept.id === u.departmentId);
            return d ? d.name : 'Unknown';
        }
        return '-';
    };

    //function to handle user deletion with confirmation
    const handleDelete = async (id: string) => {
        if(confirm('Xóa nhân viên này?')) await deleteUser(id);
    };

    //function to open edit modal and populate form with user data
    const openEdit = (u: any) => {
        setEditForm({ id: u.id, username: u.username, password: '' });
        setIsEditOpen(true);
    };

    //function to handle user update when saving changes in edit modal
    const handleUpdate = async () => {
        await updateUser(editForm.id, { username: editForm.username, password: editForm.password || undefined });
        setIsEditOpen(false);
    };

    return (
        <div className="admin-container">
            {/* --- HEADER --- */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'white', border: '1px solid #ccc', padding: '6px 12px', 
                            borderRadius: '4px', cursor: 'pointer', color: '#555', fontSize:'0.9rem',
                            fontWeight: 'bold'
                        }}
                        title="Quay về trang chủ"
                    >
                        ← Dashboard
                    </button>
                    <h2 style={{color: '#b22222', margin: 0}}>QUẢN LÝ NHÂN SỰ</h2>
                </div>

                {/* Toggle Buttons */}
                <div>
                    <button 
                        onClick={() => setViewMode('list')} 
                        style={{marginRight: '10px', padding: '8px 15px', background: viewMode==='list'?'#b22222':'#eee', color: viewMode==='list'?'white':'#333', border:'none', borderRadius:'4px', cursor:'pointer'}}
                    >
                        Danh sách
                    </button>
                    <button 
                        onClick={() => setViewMode('create')} 
                        style={{padding: '8px 15px', background: viewMode==='create'?'#b22222':'#eee', color: viewMode==='create'?'white':'#333', border:'none', borderRadius:'4px', cursor:'pointer'}}
                    >
                        + Thêm mới
                    </button>
                </div>
            </div>

            {/* --- CONTENT --- */}
            {viewMode === 'create' ? (
                <div style={{maxWidth: '500px', margin: '0 auto', paddingTop: '20px'}}>
                    <CreateUserForm isFlow1={false} onSuccess={() => { fetchUsers(); setViewMode('list'); }} />
                </div>
            ) : (
                <>
                    {/* Filter for admin total */}
                    {currentUser?.role === 'admin_total' && (
                        <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <label style={{fontWeight:'bold'}}>Lọc theo phòng:</label>
                            <select 
                                style={{padding: '6px', borderRadius:'4px', border:'1px solid #ccc'}}
                                value={filterDept}
                                onChange={e => setFilterDept(e.target.value)}
                                aria-label="Lọc danh sách nhân viên theo phòng ban"
                            >
                                <option value="all">Tất cả</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* User Table */}
                    <div style={{overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <thead>
                                <tr style={{background: '#f8f9fa', borderBottom: '2px solid #eee'}}>
                                    <th style={{padding: '12px', textAlign: 'left'}}>Username</th>
                                    <th style={{padding: '12px', textAlign: 'left'}}>Vai trò</th>
                                    <th style={{padding: '12px', textAlign: 'left'}}>Phòng ban</th>
                                    <th style={{padding: '12px', textAlign: 'center'}}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={4} style={{padding:'20px', textAlign:'center', color:'#666'}}>Không tìm thấy nhân viên nào.</td></tr>
                                ) : (
                                    filteredUsers.map(u => (
                                        <tr key={u.id} style={{borderBottom: '1px solid #eee'}}>
                                            <td style={{padding: '12px', fontWeight: 'bold', color: '#333'}}>{u.username}</td>
                                            <td style={{padding: '12px'}}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em',
                                                    background: u.role==='admin_total'?'#ffebee':(u.role==='admin_dept'?'#e3f2fd':'#f1f8e9'),
                                                    color: u.role==='admin_total'?'#c62828':(u.role==='admin_dept'?'#1565c0':'#2e7d32')
                                                }}>
                                                    {u.role === 'admin_total' ? 'Admin Tổng' : (u.role === 'admin_dept' ? 'QL Phòng' : 'Nhân viên')}
                                                </span>
                                            </td>
                                            <td style={{padding: '12px'}}>{getDeptName(u)}</td>
                                            <td style={{padding: '12px', textAlign: 'center'}}>
                                                <button onClick={() => openEdit(u)} style={{marginRight:'5px', border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}} title="Sửa" aria-label={`Sửa user ${u.username}`}>✏️</button>
                                                {currentUser?.role === 'admin_total' && (
                                                    <button onClick={() => handleDelete(u.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}} title="Xóa" aria-label={`Xóa user ${u.username}`}>🗑️</button>
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

            {/* Modal Edit */}
            {isEditOpen && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-content" style={{width: '400px'}} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop: 0, color: '#b22222'}}>Cập nhật tài khoản</h3>
                        <div className="form-group">
                            <label htmlFor="edit-username">Tên đăng nhập</label>
                            <input 
                                id="edit-username" 
                                value={editForm.username} 
                                onChange={e => setEditForm({...editForm, username: e.target.value})} 
                                aria-label="Sửa tên đăng nhập"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="edit-password">Mật khẩu mới (Để trống nếu không đổi)</label>
                            <div style={{position: 'relative'}}>
                                <input 
                                    id="edit-password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="******" 
                                    value={editForm.password} 
                                    onChange={e => setEditForm({...editForm, password: e.target.value})} 
                                    aria-label="Sửa mật khẩu mới"
                                />
                                <span 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none'}}
                                    role="button"
                                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </span>
                            </div>
                        </div>
                        <div style={{textAlign: 'right', marginTop: '20px'}}>
                            <button onClick={() => setIsEditOpen(false)} style={{marginRight: '10px', padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Hủy</button>
                            <button onClick={handleUpdate} style={{padding: '8px 15px', background: '#b22222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};