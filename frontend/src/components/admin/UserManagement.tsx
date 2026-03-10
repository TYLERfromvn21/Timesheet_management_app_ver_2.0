// frontend/src/components/admin/UserManagement.tsx
// this file contains the user management component for admin users
// and includes fixes for filtering users by department and displaying department names

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { CreateUserForm } from './CreateUserForm';

import { UserTable } from './UserTable'; 
import '../../styles/dashboard.css';

export const UserManagement = () => {
    const navigate = useNavigate();
    const { users, departments, fetchUsers, fetchDepartments, deleteUser, updateUser } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [filterDept, setFilterDept] = useState('all');
    
    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<{id: string; username: string; password: string; departmentIds: string[]; role: string}>({ id: '', username: '', password: '', departmentIds: [], role: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchUsers();
            if (currentUser.role === 'admin_total') fetchDepartments();
        }
    }, [currentUser, fetchUsers, fetchDepartments]); 

    // logic to filter users based on current user's role and
    //  selected department filter
    const filteredUsers = users.filter(u => {
        if (currentUser?.role === 'admin_total') {
            if (filterDept !== 'all') return u.departments?.some((d: any) => d.id === filterDept) || u.departmentIds?.includes(filterDept);
            return true;
        }
        if (currentUser?.role === 'admin_dept') {
            const myDeptIds = currentUser.departmentIds || [];
            return u.departments?.some((d: any) => myDeptIds.includes(d.id)) || u.departmentIds?.some((id: string) => myDeptIds.includes(id));
        }
        return false;
    });

    //function to handle user deletion with confirmation prompt
    const handleDelete = async (id: string) => {
        if(confirm('Xóa nhân viên này?')) await deleteUser(id);
    };

    //function to open the edit modal and populate it with the selected user's data
    const openEdit = (u: any) => {
        setEditForm({ 
            id: u.id, 
            username: u.username, 
            password: '', 
            role: u.role,
            departmentIds: u.departmentIds || u.departments?.map((d:any)=>d.id) || [] 
        });
        setIsEditOpen(true);
    };

    //function to handle changes in the department checkboxes in the edit form
    const handleEditCheckboxChange = (deptId: string) => {
        setEditForm(prev => {
            const isChecked = prev.departmentIds.includes(deptId);
            if (isChecked) return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== deptId) };
            return { ...prev, departmentIds: [...prev.departmentIds, deptId] };
        });
    };

    //function to handle updating the user information when the edit form is submitted
    const handleUpdate = async () => {
        await updateUser(editForm.id, { 
            username: editForm.username, 
            password: editForm.password || undefined,
            departmentIds: editForm.departmentIds 
        });
        setIsEditOpen(false);
    };

    if (!currentUser) return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
    const isDeptLocked = currentUser?.role === 'admin_dept'; 

    return (
        <div className="admin-container">
            {/* --- Header --- */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <button onClick={() => navigate('/dashboard')} style={{display: 'flex', alignItems: 'center', gap: '5px', background: 'white', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', color: '#555', fontSize:'0.9rem', fontWeight: 'bold'}}>← Dashboard</button>
                    <h2 style={{color: '#b22222', margin: 0}}>QUẢN LÝ NHÂN SỰ</h2>
                </div>
                <div>
                    <button onClick={() => setViewMode('list')} style={{marginRight: '10px', padding: '8px 15px', background: viewMode==='list'?'#b22222':'#eee', color: viewMode==='list'?'white':'#333', border:'none', borderRadius:'4px', cursor:'pointer'}}>Danh sách</button>
                    {currentUser?.role === 'admin_total' && (
                        <button onClick={() => setViewMode('create')} style={{padding: '8px 15px', background: viewMode==='create'?'#b22222':'#eee', color: viewMode==='create'?'white':'#333', border:'none', borderRadius:'4px', cursor:'pointer'}}>+ Thêm mới</button>
                    )}
                </div>
            </div>

            {viewMode === 'create' ? (
             <div style={{width: '100%', maxWidth: '500px', margin: '0 auto', padding: '20px 10px', boxSizing: 'border-box'}}>
                  <CreateUserForm isFlow1={false} onSuccess={() => { fetchUsers(); setViewMode('list'); }} />
                 </div>
                ) : (
                <>
                    {currentUser?.role === 'admin_total' && (
                        <div style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <label style={{fontWeight:'bold'}}>Lọc theo phòng:</label>
                            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{padding: '6px', borderRadius:'4px', border:'1px solid #ccc'}}>
                                <option value="all">Tất cả</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <UserTable 
                        users={filteredUsers} 
                        currentUser={currentUser} 
                        onEdit={openEdit} 
                        onDelete={handleDelete} 
                    />
                </>
            )}

            {isEditOpen && (
                <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
                    <div className="modal-content" style={{width: '450px'}} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop: 0, color: '#b22222', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Cập nhật tài khoản</h3>
                        
                        <div className="form-group" style={{marginTop: '15px'}}>
                            <label style={{fontWeight:'bold'}}>Tên đăng nhập</label>
                            <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px', marginTop:'5px'}} />
                        </div>
                        
                        <div className="form-group" style={{marginTop: '15px'}}>
                            <label style={{fontWeight:'bold'}}>Mật khẩu mới (Để trống nếu không đổi)</label>
                            <div style={{position: 'relative', marginTop:'5px'}}>
                                <input type={showPassword ? "text" : "password"} value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="******" style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                                <span onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none'}}>{showPassword ? 'Ẩn' : 'Hiện'}</span>
                            </div>
                        </div>

                        {editForm.role !== 'admin_total' && (
                            <div className="form-group" style={{marginTop: '15px'}}>
                                <label style={{fontWeight:'bold', marginBottom: '8px', display: 'block'}}>Phòng ban (Có thể chọn nhiều)</label>
                                {isDeptLocked ? (
                                    <div style={{background: '#eee', padding: '10px', borderRadius: '4px', color:'#555', fontWeight: 'bold'}}>
                                        {departments.filter(d => currentUser.departmentIds?.includes(d.id)).map(d => d.name).join(', ') || 'Phòng của tôi'}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                                        {departments.map(d => {
                                            const isChecked = editForm.departmentIds.includes(d.id);
                                            return (
                                                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px', borderRadius: '4px', backgroundColor: isChecked ? '#ffebee' : '#fff', border: `1px solid ${isChecked ? '#ef9a9a' : '#eee'}`, transition: 'all 0.2s', color: isChecked ? '#b22222' : '#333', fontSize: '0.9rem' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked}
                                                        onChange={() => handleEditCheckboxChange(d.id)}
                                                        style={{ cursor: 'pointer', accentColor: '#b22222', flexShrink: 0 }}
                                                    />
                                                    <span style={{wordBreak: 'break-word', lineHeight: '1.2', flex: 1}}>{d.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{textAlign: 'right', marginTop: '25px', paddingTop:'15px', borderTop:'1px solid #eee'}}>
                            <button onClick={() => setIsEditOpen(false)} style={{marginRight: '10px', padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'}}>Hủy</button>
                            <button onClick={handleUpdate} style={{padding: '8px 20px', background: '#b22222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'}}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};