// frontend/src/components/dashboard/DashboardHeader.tsx
// this file contains the header component for the dashboard, 
// which includes user information and actions like changing password and logging out. It also has a modal for changing the user's password. The component uses Zustand for state management and React Router for navigation.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export const DashboardHeader = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { updateUser } = useUserStore();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [modalPasswordOpen, setModalPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    if (!user) return null;

    return (
        <>
            <header className="dash-header">
                <h1>TÍN VIỆT TIMESHEET</h1>
                <div style={{ position: 'relative' }}>
                    <button 
                        className="user-menu" 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        {user.username} ({user.role}) ▼
                    </button>
                    
                    {showUserMenu && ( 
                        <div className="user-dropdown" style={{ position: 'absolute', top: '100%', right: 0, background: 'white', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '4px', marginTop: '10px', minWidth: '150px', zIndex: 1000, overflow: 'hidden' }}> 
                            <button 
                                onClick={() => { setShowUserMenu(false); setModalPasswordOpen(true); setNewPassword(''); setShowNewPassword(false); }}
                                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: 'white', border: 'none', borderBottom: '1px solid #eee', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                 Đổi mật khẩu
                            </button>
                            <button 
                                onClick={() => { logout(); navigate('/login'); }}
                                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', background: 'white', border: 'none', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                 Đăng xuất
                            </button> 
                        </div> 
                    )}
                </div>
            </header>

            {modalPasswordOpen && (
                <div className="modal-overlay" onClick={() => setModalPasswordOpen(false)}>
                    <div className="modal-content" style={{width: '400px'}} onClick={e => e.stopPropagation()}>
                        <h3 style={{marginTop: 0, color: '#b22222', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Đổi Mật Khẩu Cá Nhân</h3>
                        
                        <div className="form-group" style={{marginTop: '15px'}}>
                            <label style={{fontWeight:'bold'}}>Mật khẩu mới</label>
                            <div style={{position: 'relative', marginTop:'5px'}}>
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} 
                                    placeholder="Nhập mật khẩu mới..." 
                                    style={{width:'100%', padding:'10px', border:'1px solid #ccc', borderRadius:'4px', boxSizing: 'border-box'}} 
                                />
                                <span onClick={() => setShowNewPassword(!showNewPassword)} style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none'}}>
                                    {showNewPassword ? 'Ẩn' : 'Hiện'}
                                </span>
                            </div>
                        </div>

                        <div style={{textAlign: 'right', marginTop: '25px', paddingTop:'15px', borderTop:'1px solid #eee'}}>
                            <button onClick={() => setModalPasswordOpen(false)} style={{marginRight: '10px', padding: '8px 15px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'}}>Hủy</button>
                            <button 
                                onClick={async () => {
                                    if(!newPassword.trim()) return alert('Vui lòng nhập mật khẩu mới!');
                                    if(!confirm('Bạn có chắc chắn muốn đổi mật khẩu?')) return;
                                    setIsUpdatingPassword(true);
                                    try {
                                        await updateUser(user.id, { password: newPassword });
                                        alert('Đổi mật khẩu thành công!');
                                        setModalPasswordOpen(false);
                                    } catch(e) { alert('Lỗi: Không thể đổi mật khẩu!'); }
                                    finally { setIsUpdatingPassword(false); }
                                }} 
                                disabled={isUpdatingPassword}
                                style={{padding: '8px 20px', background: '#b22222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'}}
                            >
                                {isUpdatingPassword ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};