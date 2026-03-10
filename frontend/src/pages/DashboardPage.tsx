// frontend/src/pages/DashboardPage.tsx
// this file is the main dashboard page for the timesheet management app.
//  It displays the user's tasks in a timeline view,
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';


import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AdminPanel } from '../components/dashboard/AdminPanel';
import { TimelineView } from '../components/dashboard/TimelineView'; 

import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { TaskForm } from '../components/timesheet/TaskForm';

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

    //function to initialize dashboard data on component mount
    useEffect(() => {
        const initDashboard = async () => {
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
        };
        initDashboard();
    }, []); 

    //function to refetch tasks when selected date changes
    useEffect(() => {
        if (user) fetchTasks(user.id);
    }, [selectedDate]); 

    //function to navigate between dates in the dashboard
    const handleAddDays = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setDate(d);
    };

    if (!user) return <div className="loading">Đang tải dữ liệu...</div>;

    const isAdmin = user.role === 'admin_total' || user.role === 'admin_dept';

    return (
        <main className="dashboard-body">
            <DashboardHeader />
            
            <a href="https://forms.gle/yxhx5kWoTJXS1VXv7" target="_blank" className="btn-feedback" rel="noreferrer">🐞</a>
            
            <div className="dash-container">
                <div className="main-panel">
                    <div className="date-nav">
                        <button className="btn-nav" onClick={() => handleAddDays(-1)}>❮ Hôm qua</button>
                        <h2>{selectedDate.toLocaleDateString('vi-VN')}</h2>
                        <button className="btn-nav" onClick={() => handleAddDays(1)}>Ngày mai ❯</button>
                    </div>
                    
                    <div className="task-list" style={{ position: 'relative', minHeight: '300px' }}>
                        <TimelineView tasks={tasks} onTaskClick={(t) => { setEditTask(t); setModalTaskOpen(true); }}/>
                    </div>
                    <button className="btn-add" onClick={() => { setEditTask(null); setModalTaskOpen(true); }}>+ Khai báo công việc</button>
                </div>

                {isAdmin && (
                    <AdminPanel setModalReportType={setModalReportType} setModalDeptOpen={setModalDeptOpen} />
                )}
            </div>

            {modalTaskOpen && <TaskForm isOpen={modalTaskOpen} onClose={() => setModalTaskOpen(false)} editTask={editTask} date={selectedDate} />}
            {modalReportType && <ReportGenerator type={modalReportType} onClose={() => setModalReportType(null)} />}
            {modalDeptOpen && <DepartmentManagement onClose={() => setModalDeptOpen(false)} />}
        </main>
    );
}