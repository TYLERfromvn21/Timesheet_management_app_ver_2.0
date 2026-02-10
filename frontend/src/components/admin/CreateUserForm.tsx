// frontend/src/components/admin/CreateUserForm.tsx
// this file provides a form interface for creating new users in the admin panel
// it includes logic to limit the number of total admins to 3 and handles different user roles.
import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import '../../styles/admin-create.css';

interface CreateUserFormProps {
    onSuccess: () => void;
    isFlow1: boolean; // True = Setup Mode
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess, isFlow1 }) => {
    const { users, departments, fetchDepartments, addUser, isLoading, fetchUsers } = useUserStore();
    const currentUser = useAuthStore(state => state.user);

    const [formData, setFormData] = useState({
        username: '', 
        password: '', 
        role: isFlow1 ? 'admin_total' : 'user', // base default
        departmentId: ''
    });
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    //fetch departments on mount
    useEffect(() => {
        const init = async () => {
            if (!isFlow1) {
                await fetchDepartments();
                // Load users to check admin count
                if (users.length === 0) await fetchUsers();
            }

            // if current user is admin_dept, set departmentId automatically
            if (currentUser?.role === 'admin_dept') {
                // take care of both object and id cases
                const myDeptId = currentUser.departmentId || 
                    (typeof currentUser.department === 'object' ? (currentUser.department as any).id : currentUser.department);
                
                // update formData
                setFormData(prev => ({ 
                    ...prev, 
                    role: 'user', // Admin Dept can only create normal users
                    departmentId: myDeptId 
                }));
            }
        };
        init();
    }, [isFlow1, currentUser]); 

    //function to handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Basic validation
        if (!formData.username || !formData.password) {
            setMessage({ type: 'error', text: 'Vui lòng điền đủ thông tin!' });
            return;
        }

        // max 3 admin_total check
        if (formData.role === 'admin_total') {
            const adminCount = users.filter(u => u.role === 'admin_total').length;
            if (!isFlow1 && adminCount >= 3) {
                alert("⚠️ GIỚI HẠN: Hệ thống chỉ cho phép tối đa 3 Admin Tổng.");
                return;
            }
        }

        try {
            // prepare payload to send to backend
            const payload = {
                ...formData,
                departmentId: formData.role === 'admin_total' ? undefined : formData.departmentId
            };

            await addUser(payload);
            
            alert(isFlow1 ? "Khởi tạo hệ thống thành công! Hãy đăng nhập ngay." : "Tạo tài khoản thành công!");
            
            // Reset form
            setFormData(prev => ({ 
                ...prev, 
                username: '', 
                password: '',
                // keep role and departmentId for convenience to create multiple users
                departmentId: currentUser?.role === 'admin_dept' ? prev.departmentId : '' 
            }));
            
            onSuccess();

        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Lỗi tạo tài khoản' });
        }
    };

    // function to get current user's department name
    const getMyDeptName = () => {
        if (currentUser?.department && typeof currentUser.department === 'object') {
            return (currentUser.department as any).name;
        }
        // Fallback to find from departments list
        const d = departments.find(dept => dept.id === formData.departmentId);
        return d ? d.name : 'Phòng của tôi';
    };

    const isDeptLocked = currentUser?.role === 'admin_dept'; 

    return (
        <div className="create-card">
            <h1 className="create-h1" style={{color: isFlow1 ? '#b22222' : '#333'}}>
                {isFlow1 ? "👑 THIẾT LẬP ADMIN ĐẦU TIÊN" : "TẠO TÀI KHOẢN MỚI"}
            </h1>

            {message && (
                <div className={`message-box ${message.type}`} style={{ 
                    padding: '10px', marginBottom: '15px', borderRadius: '4px',
                    backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
                    color: message.type === 'error' ? '#c62828' : '#2e7d32',
                    border: `1px solid ${message.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input 
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required 
                        placeholder="Nhập username..."
                    />
                </div>
                <div className="form-group">
                    <label>Mật khẩu</label>
                    <input 
                        type="password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                        placeholder="******"
                    />
                </div>
                
                {/* hide Role if it in Setup Mode */}
                {!isFlow1 && (
                    <div className="form-group">
                        <label>Loại tài khoản</label>
                        <select 
                            value={formData.role} 
                            onChange={e => setFormData({...formData, role: e.target.value})}
                            disabled={isDeptLocked}
                        >
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
                        {formData.role === 'admin_total' && (
                            <small style={{color:'#f57c00', display:'block', marginTop:'5px'}}>
                                ℹ️ Giới hạn tối đa 3 Admin Tổng.
                            </small>
                        )}
                    </div>
                )}

                {/* Dropdown department */}
                {formData.role !== 'admin_total' && (
                    <div className="form-group">
                        <label>Phòng ban</label>
                        {isDeptLocked ? (
                            <input 
                                value={getMyDeptName()} 
                                disabled 
                                style={{background: '#eee', color:'#555'}}
                            />
                        ) : (
                            // Admin Total can choose department
                            <select 
                                value={formData.departmentId} 
                                onChange={e => setFormData({...formData, departmentId: e.target.value})}
                            >
                                <option value="">-- Chọn --</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <button type="submit" className="create-btn" disabled={isLoading} style={{background: isFlow1 ? '#d32f2f' : '#b22222'}}>
                    {isLoading ? 'Đang xử lý...' : (isFlow1 ? 'KHỞI TẠO HỆ THỐNG' : 'TẠO TÀI KHOẢN')}
                </button>
            </form>
        </div>
    );
};