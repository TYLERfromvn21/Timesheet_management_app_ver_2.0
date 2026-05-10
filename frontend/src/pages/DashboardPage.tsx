// frontend/src/pages/DashboardPage.tsx
// this file is the main dashboard page for the timesheet management app.
//  It displays the user's tasks in a timeline view,
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import apiClient from '../services/api.client';


import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AdminPanel } from '../components/dashboard/AdminPanel';
import { TimelineView } from '../components/dashboard/TimelineView'; 

import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { TaskForm } from '../components/timesheet/TaskForm';
import { JobCodeManagementModal } from '../components/admin/JobCodeManagementModal';

import '../styles/dashboard.css';
import '../styles/dashboard-mobile.css';

export default function DashboardPage() {
    const { user, checkAuth } = useAuthStore();
    const { selectedDate, setDate, tasks, fetchTasks } = useTaskStore();
    const { fetchDepartments } = useUserStore(); 

    const [modalTaskOpen, setModalTaskOpen] = useState(false);
    const [editTask, setEditTask] = useState<any>(null);
    const [modalReportType, setModalReportType] = useState<'USER' | 'JOB' | null>(null);
    const [modalDeptOpen, setModalDeptOpen] = useState(false);
    const [modalJobCodeOpen, setModalJobCodeOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [deadlineDate, setDeadlineDate] = useState<string | null>(null);

    //function to initialize dashboard data on component mount
    useEffect(() => {
        const initDashboard = async () => {
            try {
                setIsInitialLoading(true);
                await checkAuth();
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    const promises = [];
                    promises.push(fetchTasks(currentUser.id));
                    if (currentUser.role === 'admin_total') {
                        promises.push(fetchDepartments());
                    }
                    await Promise.all(promises);
                }
            } catch (error) {
                console.error('Error initializing dashboard:', error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        initDashboard();
    }, []); 

    //function to refetch tasks when selected date changes
    useEffect(() => {
        if (user) fetchTasks(user.id);
    }, [selectedDate, user]); 

    //function to fetch deadline date from backend
    useEffect(() => {
        const fetchDeadline = async () => {
            try {
                // const response = await fetch('http://localhost:3000/api/config/deadline');
                // const data = await response.json();
                // setDeadlineDate(data.deadlineDate);
                const response = await apiClient.get('/config/deadline');
                setDeadlineDate(response.data.deadlineDate);
            } catch (error) {
                console.error('Error fetching deadline:', error);
            }
        };
        fetchDeadline();
    }, []);

    if (isInitialLoading || !user) return <div className="loading">Đang tải dữ liệu...</div>;

    const isAdmin = user.role === 'admin_total' || user.role === 'admin_dept';

    return (
        <main className="dashboard-body">
            <DashboardHeader />
            
            <a href="https://forms.gle/yxhx5kWoTJXS1VXv7" target="_blank" className="btn-feedback" rel="noreferrer">🐞</a>
            
            <div className="dash-container">
                <div className="main-panel">
                    <div className="date-nav">
                        <input 
                            type="date" 
                            value={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                            onChange={(e) => {
                                if (e.target.value) { 
                                    setDate(new Date(e.target.value));
                                }
                            }}
                            style={{ 
                                padding: '8px 12px', 
                                fontSize: '1rem', 
                                border: '1px solid #ccc', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        />

                         {deadlineDate && (
                <div style={{
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                    border: '2px solid #ff9800',
                    borderRadius: '4px',
                    padding: '7px 15px',
                    margin: '15px auto',
                    maxWidth: '1200px',
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#e65100'
                }}>
                    <span style={{ fontSize: '1.0rem' }}>Deadline</span>
                    <span>
                        Khai báo bổ sung cho tháng 1-4/2026: <strong>{new Date(deadlineDate).toLocaleDateString('vi-VN')}</strong>
                    </span>
                </div>
            )}
                    </div>
                    
                    <div className="task-list" style={{ position: 'relative', minHeight: '300px' }}>
                        <TimelineView tasks={tasks} onTaskClick={(t) => { setEditTask(t); setModalTaskOpen(true); }}/>
                    </div>
                    <button className="btn-add" onClick={() => { setEditTask(null); setModalTaskOpen(true); }}>+ Khai báo công việc</button>
                </div>

                {isAdmin && (
                    <AdminPanel setModalReportType={setModalReportType} setModalDeptOpen={setModalDeptOpen} setModalJobCodeOpen={setModalJobCodeOpen} />
                )}
            </div>

            {modalTaskOpen && <TaskForm isOpen={modalTaskOpen} onClose={() => setModalTaskOpen(false)} editTask={editTask} date={editTask?.date ? new Date(editTask.date) : selectedDate} />}
            {modalReportType && <ReportGenerator type={modalReportType} onClose={() => setModalReportType(null)} />}
            {modalDeptOpen && <DepartmentManagement onClose={() => setModalDeptOpen(false)} />}
            {modalJobCodeOpen && <JobCodeManagementModal isOpen={modalJobCodeOpen} onClose={() => setModalJobCodeOpen(false)} />}
        </main>
    );
}