// frontend/src/pages/DashboardPage.tsx
// this file is the main dashboard page for the timesheet management app.
//  It displays the user's tasks in a timeline view,
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { declarationService } from '../services/declaration.service';
import type { Task } from '../types/task.types';


import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AdminPanel } from '../components/dashboard/AdminPanel';
import { TimelineView } from '../components/dashboard/TimelineView'; 

import { DepartmentManagement } from '../components/admin/DepartmentManagement';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { TaskForm } from '../components/timesheet/TaskForm';
import { JobCodeManagementModal } from '../components/admin/JobCodeManagementModal';
import { DeclarationManagementModal } from '../components/dashboard/DeclarationManagementModal';
import { OldDeclarationModal } from '../components/timesheet/OldDeclarationModal';
import type { DeclarationConfig } from '../types/declaration.types';

import '../styles/dashboard.css';
import '../styles/dashboard-mobile.css';

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
    const { user, checkAuth } = useAuthStore();
    const { selectedDate, setDate, tasks, fetchTasks } = useTaskStore();
    const { fetchDepartments } = useUserStore(); 

    const [modalTaskOpen, setModalTaskOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [modalReportType, setModalReportType] = useState<'USER' | 'JOB' | null>(null);
    const [modalDeptOpen, setModalDeptOpen] = useState(false);
    const [modalJobCodeOpen, setModalJobCodeOpen] = useState(false);
    const [modalDeclarationOpen, setModalDeclarationOpen] = useState(false);
    const [oldDeclarationOpen, setOldDeclarationOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [declarationConfig, setDeclarationConfig] = useState<DeclarationConfig | null>(null);
    const todayValue = toDateInputValue(new Date());
    const isDeclarationLocked = declarationConfig?.mode === 'LOCKED';
    const isDeclarationOpenDate = declarationConfig?.mode === 'OPEN_DATE';

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

    useEffect(() => {
        const fetchDeclarationConfig = async () => {
            try {
                const config = await declarationService.getCurrent();
                setDeclarationConfig(config);
                if (config.mode === 'OPEN_DATE' && config.specificDate) {
                    setDate(new Date(`${config.specificDate}T00:00:00Z`));
                }
            } catch (error) {
                console.error('Error fetching declaration config:', error);
            }
        };
        fetchDeclarationConfig();
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
                            min={(isDeclarationLocked || isDeclarationOpenDate) ? todayValue : undefined}
                            value={selectedDate && !isNaN(selectedDate.getTime()) ? toDateInputValue(selectedDate) : todayValue} 
                            onChange={(e) => {
                                if (!e.target.value) return;
                                if ((isDeclarationLocked || isDeclarationOpenDate) && e.target.value < todayValue) return;
                                setDate(new Date(`${e.target.value}T00:00:00Z`));
                            }}
                            onKeyDown={(e) => {
                                if (isDeclarationLocked && e.key === 'Backspace') {
                                    e.preventDefault();
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

                    </div>
                    
                    <div className="task-list" style={{ position: 'relative', minHeight: '300px' }}>
                        <TimelineView tasks={tasks} onTaskClick={(t) => { setEditTask(t); setModalTaskOpen(true); }}/>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button className="btn-add" onClick={() => { setEditTask(null); setModalTaskOpen(true); }}>+ Khai báo công việc</button>
                        {declarationConfig && declarationConfig.mode !== 'LOCKED' && (
                            <button className="btn-add" style={{ background: '#0069d9' }} onClick={() => setOldDeclarationOpen(true)}>
                                Chỉnh sửa khai báo cũ
                            </button>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <AdminPanel
                        setModalReportType={setModalReportType}
                        setModalDeptOpen={setModalDeptOpen}
                        setModalJobCodeOpen={setModalJobCodeOpen}
                        setModalDeclarationOpen={setModalDeclarationOpen}
                    />
                )}
            </div>

            {modalTaskOpen && <TaskForm isOpen={modalTaskOpen} onClose={() => setModalTaskOpen(false)} editTask={editTask} date={editTask?.date ? new Date(editTask.date) : selectedDate} />}
            {modalReportType && <ReportGenerator type={modalReportType} onClose={() => setModalReportType(null)} />}
            {modalDeptOpen && <DepartmentManagement onClose={() => setModalDeptOpen(false)} />}
            {modalJobCodeOpen && <JobCodeManagementModal isOpen={modalJobCodeOpen} onClose={() => setModalJobCodeOpen(false)} />}
            {modalDeclarationOpen && (
                <DeclarationManagementModal
                    isOpen={modalDeclarationOpen}
                    onClose={() => setModalDeclarationOpen(false)}
                    onSaved={(config) => setDeclarationConfig(config)}
                />
            )}
            {oldDeclarationOpen && (
                <OldDeclarationModal
                    isOpen={oldDeclarationOpen}
                    onClose={() => setOldDeclarationOpen(false)}
                />
            )}
        </main>
    );
}
