// frontend/src/pages/DashboardPage.tsx
// this file contains the main dashboard page with task timeline and admin controls
// and includes fixes for task rendering and saving issues

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';

// Import Component 
import { TimelineView } from '../components/dashboard/TimelineView'; 
import { JobCodeManagement } from '../components/admin/JobCodeManagement';
import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { TaskForm } from '../components/timesheet/TaskForm';

import '../styles/dashboard.css';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout, checkAuth } = useAuthStore();
    const { selectedDate, setDate, tasks, fetchTasks } = useTaskStore();
    const { fetchDepartments } = useUserStore();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [modalTaskOpen, setModalTaskOpen] = useState(false);
    const [editTask, setEditTask] = useState<any>(null);
    
    // Modal Admin
    const [modalReportType, setModalReportType] = useState<'USER' | 'JOB' | null>(null);
    const [modalDeptOpen, setModalDeptOpen] = useState(false);

    useEffect(() => {
        checkAuth();
        // Admin total fetch departments
        if (useAuthStore.getState().user?.role === 'admin_total') {
            fetchDepartments();
        }
    }, []);

    useEffect(() => {
        if (user) fetchTasks(user.id);
    }, [selectedDate, user]);

    const handleAddDays = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setDate(d);
    };

    if (!user) return <div className="loading">Đang tải...</div>;

    const isAdmin = user.role === 'admin_total' || user.role === 'admin_dept';
    const isTotalAdmin = user.role === 'admin_total';

    return (
        <div className="dashboard-body">
            {/* --- HEADER --- */}
            <div className="dash-header">
                <h1>TÍN VIỆT TIMESHEET</h1>
                <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                    {user.username} ({user.role}) ▼
                    {showUserMenu && ( 
                        <div className="user-dropdown"> 
                            <button onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button> 
                        </div> 
                    )}
                </div>
            </div>
            
            {/* Error form report button */}
            <a 
                href="https://forms.gle/yxhx5kWoTJXS1VXv7" 
                target="_blank" 
                className="btn-feedback" 
                rel="noreferrer"
                title="Báo lỗi hoặc góp ý"
            >
                🐞
            </a>
            
            <div className="dash-container">
                {/* --- MAIN PANEL (TIMELINE) --- */}
                <div className="main-panel">
                    <div className="date-nav">
                        <button className="btn-nav" onClick={() => handleAddDays(-1)}>❮ Hôm qua</button>
                        <h2>{selectedDate.toLocaleDateString('vi-VN')}</h2>
                        <button className="btn-nav" onClick={() => handleAddDays(1)}>Ngày mai ❯</button>
                    </div>
                    
                    <div className="task-list" style={{ position: 'relative', minHeight: '300px' }}>
                        <TimelineView 
                            tasks={tasks} 
                            onTaskClick={(t) => { setEditTask(t); setModalTaskOpen(true); }}
                        />
                    </div>
                    <button className="btn-add" onClick={() => { setEditTask(null); setModalTaskOpen(true); }}>+ Khai báo công việc</button>
                </div>

                {/* --- ADMIN PANEL --- */}
                {isAdmin && (
                    <div className="admin-panel">
                        <h3 style={{color: '#b22222', borderBottom: '1px solid #eee', paddingBottom:'10px'}}>QUẢN TRỊ VIÊN</h3>
                        
                        {/* Jobcode management */}
                        <JobCodeManagement />

                        {/* Report */}
                        {isTotalAdmin && (
                            <div className="report-control">
                                <label><strong>XUẤT BÁO CÁO</strong></label>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <button className="btn-action" style={{background:'#2ecc71'}} onClick={() => setModalReportType('USER')}>Theo NV</button>
                                    <button className="btn-action" style={{background:'#3498db'}} onClick={() => setModalReportType('JOB')}>Theo Job</button>
                                </div>
                            </div>
                        )}

                        {/* Management */}
                        <div className="report-control">
                            <label><strong>HỆ THỐNG</strong></label>
                            <button className="btn-action" style={{background:'#8e44ad', marginBottom:'5px'}} onClick={() => navigate('/admin/users')}>
                                Quản lý Tài khoản
                            </button>
                            {isTotalAdmin && (
                                <button className="btn-action" style={{background:'#f39c12'}} onClick={() => setModalDeptOpen(true)}>
                                    🏢 Quản lý Phòng Ban
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {modalTaskOpen && <TaskForm isOpen={modalTaskOpen} onClose={() => setModalTaskOpen(false)} editTask={editTask} date={selectedDate} />}
            {modalReportType && <ReportGenerator type={modalReportType} onClose={() => setModalReportType(null)} />}
            {modalDeptOpen && <DepartmentManagement onClose={() => setModalDeptOpen(false)} />}
        </div>
    );
}