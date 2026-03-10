// frontend/src/components/dashboard/AdminPanel.tsx
// this file is for the admin panel in the dashboard, 
// which includes job code management and report generation features. 
// It also has buttons for navigating to user management and department management 
// (for total admins only).
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { JobCodeManagement } from '../admin/JobCodeManagement';

// Props for AdminPanel component
interface AdminPanelProps {
    setModalReportType: (type: 'USER' | 'JOB' | null) => void;
    setModalDeptOpen: (isOpen: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ setModalReportType, setModalDeptOpen }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isTotalAdmin = user?.role === 'admin_total';

    // Render the admin panel with job code management and report generation options
    return (
        <div className="admin-panel">
            <h3 style={{color: '#b22222', borderBottom: '1px solid #eee', paddingBottom:'10px'}}>QUẢN TRỊ VIÊN</h3>
            
            <JobCodeManagement />
            
            {isTotalAdmin && (
                <div className="report-control">
                    <label><strong>XUẤT BÁO CÁO</strong></label>
                    <div style={{display:'flex', gap:'5px'}}>
                        <button className="btn-action" style={{background:'#218838'}} onClick={() => setModalReportType('USER')}>Theo User</button>
                        <button className="btn-action" style={{background:'#0069d9'}} onClick={() => setModalReportType('JOB')}>Theo Job</button>
                    </div>
                </div>
            )}

            <div className="report-control">
                <label><strong>HỆ THỐNG</strong></label>
                <button className="btn-action" style={{background:'#6a3382', marginBottom:'5px'}} onClick={() => navigate('/admin/users')}>
                    Quản lý Tài khoản
                </button>
                {isTotalAdmin && (
                    <button className="btn-action" style={{background:'#d68910'}} onClick={() => setModalDeptOpen(true)}>
                        Quản lý Phòng Ban
                    </button>
                )}
            </div>
        </div>
    );
};