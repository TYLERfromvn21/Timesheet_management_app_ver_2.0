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

    // fetch initial data on mount
    useEffect(() => {
        const initDashboard = async () => {
            // check authentication for security and to get user info (like role and department)
            await checkAuth();
            
            // Get current user from the store
            const currentUser = useAuthStore.getState().user;
            
            if (currentUser) {
                // create an array to hold promises
                const promises = [];
                
                // always fetch tasks for the current user
                promises.push(fetchTasks(currentUser.id));
                
                // if admin, also fetch departments
                if (currentUser.role === 'admin_total') {
                    promises.push(fetchDepartments());
                }

                // run all fetches in parallel
                await Promise.all(promises);
            }
        };
        
        initDashboard();
    }, []); // run only once on mount

    // if selectedDate changes, refetch tasks for that date
    useEffect(() => {
        if (user) fetchTasks(user.id);
    }, [selectedDate]); 

    //function to handle date navigation
    const handleAddDays = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setDate(d);
    };

    // if not logged in, show loading or redirect to login
    if (!user) return <div className="loading">Đang tải dữ liệu...</div>;

    const isAdmin = user.role === 'admin_total' || user.role === 'admin_dept';
    const isTotalAdmin = user.role === 'admin_total';

    // Render the dashboard page
    return (
        <main className="dashboard-body">
            <header className="dash-header">
                <h1>TÍN VIỆT TIMESHEET</h1>
                
                <div style={{ position: 'relative' }}>
                    <button 
                        className="user-menu" 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            background: 'transparent', 
                            border: 'none', 
                            color: 'white', 
                            fontSize: '1rem', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                        aria-expanded={showUserMenu}
                        aria-haspopup="true"
                        aria-label="Menu tài khoản"
                    >
                        {user.username} ({user.role}) ▼
                    </button>
                    
                    {showUserMenu && ( 
                        <div className="user-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'white',
                            color: '#333',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '4px',
                            marginTop: '10px',
                            minWidth: '150px',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}> 
                            <button 
                                onClick={() => { logout(); navigate('/login'); }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 15px',
                                    background: 'white',
                                    border: 'none',
                                    color: '#d32f2f',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                Đăng xuất
                            </button> 
                        </div> 
                    )}
                </div>

            </header>
            
            <a 
                href="https://forms.gle/yxhx5kWoTJXS1VXv7" 
                target="_blank" 
                className="btn-feedback" 
                rel="noreferrer"
                aria-label="Báo lỗi phần mềm"
            >
                🐞
            </a>
            
            <div className="dash-container">
                <div className="main-panel">
                    <div className="date-nav">
                        <button className="btn-nav" onClick={() => handleAddDays(-1)} aria-label="Ngày trước">❮ Hôm qua</button>
                        <h2>{selectedDate.toLocaleDateString('vi-VN')}</h2>
                        <button className="btn-nav" onClick={() => handleAddDays(1)} aria-label="Ngày sau">Ngày mai ❯</button>
                    </div>
                    
                    <div className="task-list" style={{ position: 'relative', minHeight: '300px' }}>
                        <TimelineView 
                            tasks={tasks} 
                            onTaskClick={(t) => { setEditTask(t); setModalTaskOpen(true); }}
                        />
                    </div>
                    <button className="btn-add" onClick={() => { setEditTask(null); setModalTaskOpen(true); }}>+ Khai báo công việc</button>
                </div>

                {isAdmin && (
                    <div className="admin-panel">
                        <h3 style={{color: '#b22222', borderBottom: '1px solid #eee', paddingBottom:'10px'}}>QUẢN TRỊ VIÊN</h3>
                        
                        <JobCodeManagement />
                        
                        {isTotalAdmin && (
                            <div className="report-control">
                                <label><strong>XUẤT BÁO CÁO</strong></label>
                                <div style={{display:'flex', gap:'5px'}}>
                                    <button className="btn-action" style={{background:'#218838'}} onClick={() => setModalReportType('USER')}>Theo NV</button>
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
                                    🏢 Quản lý Phòng Ban
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalTaskOpen && <TaskForm isOpen={modalTaskOpen} onClose={() => setModalTaskOpen(false)} editTask={editTask} date={selectedDate} />}
            {modalReportType && <ReportGenerator type={modalReportType} onClose={() => setModalReportType(null)} />}
            {modalDeptOpen && <DepartmentManagement onClose={() => setModalDeptOpen(false)} />}
        </main>
    );
}