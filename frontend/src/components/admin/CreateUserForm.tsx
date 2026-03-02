// frontend/src/components/admin/CreateUserForm.tsx
// this file provides a form interface for creating new users in the admin panel
// it includes logic to limit the number of total admins to 3 and handles different user roles.

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import '../../styles/admin-create.css';

// Props for the CreateUserForm component
interface CreateUserFormProps {
    onSuccess: () => void;
    isFlow1: boolean;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess, isFlow1 }) => {
    const { users, departments, fetchDepartments, addUser, isLoading, fetchUsers } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    const [formData, setFormData] = useState<{
        username: string;
        password: string;
        role: string;
        departmentIds: string[];
    }>({
        username: '', 
        password: '', 
        role: isFlow1 ? 'admin_total' : 'user', 
        departmentIds: []
    });
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    //function to initialize data when the component mounts
    useEffect(() => {
        const init = async () => {
            if (!isFlow1) {
                await fetchDepartments();
                if (users.length === 0) await fetchUsers();
            }
            if (currentUser?.role === 'admin_dept') {
                const myDeptIds = currentUser.departmentIds || [];
                setFormData(prev => ({ ...prev, role: 'user', departmentIds: myDeptIds }));
            }
        };
        init();
    }, [isFlow1, currentUser]); 

    //function to handle checkbox changes for department selection
    const handleCheckboxChange = (deptId: string) => {
        setFormData(prev => {
            const isChecked = prev.departmentIds.includes(deptId);
            if (isChecked) {
                return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== deptId) };
            } else {
                return { ...prev, departmentIds: [...prev.departmentIds, deptId] };
            }
        });
    };

    //function to handle form submission for creating a new user
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!formData.username || !formData.password) {
            setMessage({ type: 'error', text: 'Vui lòng điền đủ thông tin!' });
            return;
        }
        if (formData.role !== 'admin_total' && formData.departmentIds.length === 0) {
            setMessage({ type: 'error', text: 'Vui lòng chọn ít nhất 1 phòng ban!' });
            return;
        }
        if (formData.role === 'admin_total') {
            const adminCount = users.filter(u => u.role === 'admin_total').length;
            if (!isFlow1 && adminCount >= 3) {
                alert("⚠️ GIỚI HẠN: Hệ thống chỉ cho phép tối đa 3 Admin Tổng.");
                return;
            }
        }

        try {
            const payload = { ...formData, departmentIds: formData.role === 'admin_total' ? undefined : formData.departmentIds };
            await addUser(payload);
            alert(isFlow1 ? "Khởi tạo hệ thống thành công! Hãy đăng nhập ngay." : "Tạo tài khoản thành công!");
            setFormData(prev => ({ ...prev, username: '', password: '', departmentIds: currentUser?.role === 'admin_dept' ? prev.departmentIds : [] }));
            onSuccess();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Lỗi tạo tài khoản' });
        }
    };

    const isDeptLocked = currentUser?.role === 'admin_dept'; 

    // render the form with conditional fields and 
    // messages based on the current user's role and the flow type
    return (
        <div className="create-card">
            <h1 className="create-h1" style={{color: isFlow1 ? '#b22222' : '#333'}}>
                {isFlow1 ? "THIẾT LẬP ADMIN" : "TẠO TÀI KHOẢN MỚI"}
            </h1>

            {message && (
                <div className={`message-box ${message.type}`} style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9', color: message.type === 'error' ? '#c62828' : '#2e7d32', border: `1px solid ${message.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`}}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required placeholder="Nhập username..." />
                </div>
                <div className="form-group">
                    <label>Mật khẩu</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="******" />
                </div>
                
                {!isFlow1 && (
                    <div className="form-group">
                        <label>Loại tài khoản</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isDeptLocked}>
                            {currentUser?.role === 'admin_total' && (
                                <>
                                    <option value="user">Nhân viên</option>
                                    <option value="admin_dept">Quản lý Phòng ban</option>
                                    <option value="admin_total">Admin Tổng</option>
                                </>
                            )}
                            {currentUser?.role === 'admin_dept' && (
                                <option value="user">Nhân viên</option>
                            )}
                        </select>
                    </div>
                )}

                {formData.role !== 'admin_total' && (
                    <div className="form-group">
                        <label style={{marginBottom: '8px', display: 'block'}}>Phòng ban (Có thể chọn nhiều)</label>
                        {isDeptLocked ? (
                            <div style={{background: '#eee', padding: '10px', borderRadius: '4px', color:'#555', fontWeight: 'bold'}}>
                                {departments.filter(d => currentUser.departmentIds?.includes(d.id)).map(d => d.name).join(', ') || 'Phòng của tôi'}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', maxHeight: '180px', overflowY: 'auto', border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                                {departments.map(d => {
                                    const isChecked = formData.departmentIds.includes(d.id);
                                    return (
                                        <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: isChecked ? '#ffebee' : '#fff', border: `1px solid ${isChecked ? '#ef9a9a' : '#eee'}`, transition: 'all 0.2s ease', color: isChecked ? '#b22222' : '#333', fontWeight: isChecked ? 'bold' : 'normal', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(d.id)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#b22222' }}
                                            />
                                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={d.name}>{d.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <button type="submit" className="create-btn" disabled={isLoading} style={{background: isFlow1 ? '#d32f2f' : '#b22222', marginTop: '15px'}}>
                    {isLoading ? 'Đang xử lý...' : (isFlow1 ? 'KHỞI TẠO HỆ THỐNG' : 'TẠO TÀI KHOẢN')}
                </button>
            </form>
        </div>
    );
};