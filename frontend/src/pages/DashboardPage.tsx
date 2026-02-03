// frontend/src/pages/DashboardPage.tsx
// this file contains the main dashboard page with task timeline and admin controls
// and includes fixes for task rendering and saving issues
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

// Types
interface User { id: string; username: string; role: string; department: string; departmentId?: string; }
interface Task { id: string; job_code: string; task_description: string; start_time: string; end_time: string;     userId?: string;  createdBy?: string;  }
interface Job { id: string; job_code: string; task_description: string; }
interface Department { id: string; code: string; name: string; }

export default function DashboardPage() {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // Job Lists
    const [jobs, setJobs] = useState<Job[]>([]); 
    const [adminJobList, setAdminJobList] = useState<Job[]>([]); 
    
    // Modal State
    const [modalTaskOpen, setModalTaskOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<string | null>(null);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [taskFormData, setTaskFormData] = useState({
        department: '', job_code: '', description: '', start: '08:00', end: '17:00'
    });
    const [todayJobHistory, setTodayJobHistory] = useState<string>(''); 

    // Admin State
    const [modalDeptOpen, setModalDeptOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [modalReportOpen, setModalReportOpen] = useState(false);
    const [reportConfig, setReportConfig] = useState({ type: 'USER', month: new Date().getMonth() + 1, year: new Date().getFullYear(), userId: '', deptFilter: 'all' });
    const [reportUsers, setReportUsers] = useState<User[]>([]);

    // Admin Job Management
    const [adminSelectedDept, setAdminSelectedDept] = useState('');
    const [newJobData, setNewJobData] = useState({ code: '', desc: '' });

    // --- FORMAT DATE LOCAL ---
    const getLocalISODate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    // --- INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');
            try {
                const res = await fetch('http://localhost:3000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const deptsRes = await fetch('http://localhost:3000/api/departments');
                const deptsData = await deptsRes.json();
                setDepartments(deptsData);

                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                    if (userData.role === 'admin_dept') {
                        setAdminSelectedDept(userData.department); 
                        loadJobsByDept(userData.department, 'ADMIN');
                    }
                } else navigate('/login');
            } catch (e) { navigate('/login'); }
        };
        init();
    }, [navigate]);

    useEffect(() => { if (user) loadTasks(); }, [currentDate, user]);

    // --- API CALLS ---
const loadTasks = async () => {
    const dateStr = getLocalISODate(currentDate);
    try {
        const token = localStorage.getItem('token');  // Get token
        const res = await fetch(`http://localhost:3000/api/tasks/${dateStr}`, {
            headers: { 
                'Authorization': `Bearer ${token}`  // Send token
            }
        });
        
        if (!res.ok) {
            console.error('Failed to load tasks');
            setTasks([]);
            return;
        }
        
        const data = await res.json();
        setTasks(data);
    } catch(e) {
        console.error('Error loading tasks:', e);
        setTasks([]);
    }
};

    const loadDepartments = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/departments');
            setDepartments(await res.json());
        } catch(e) {}
    };

    const loadJobsByDept = async (deptIdentifier: string, target: 'USER' | 'ADMIN') => {
        if(!deptIdentifier) return;
        try {
            const res = await fetch(`http://localhost:3000/api/job-codes/${deptIdentifier}`);
            const data = await res.json();
            if (target === 'USER') setJobs(data);
            else setAdminJobList(data);
        } catch(e) {}
    };

    // --- TIMELINE LOGIC ---
    const handleAddDays = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const renderTimeSlots = () => {
        const slots = []; for (let i = 6; i <= 22; i++) slots.push(<div key={i} className="time-slot"><span className="time-label">{i}:00</span></div>); return slots;
    };

    // --- RENDER TASKS ON TIMELINE ---
    const renderTasksOnTimeline = () => {
        return tasks.map(t => {
            // check for valid start and end times
            if (!t.start_time || !t.end_time) return null;

            const s = new Date(t.start_time);
            const e = new Date(t.end_time);

            // skip if invalid dates
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

            const startHour = s.getHours();
            const startPos = (startHour - 6) + s.getMinutes() / 60;
            const duration = (e.getTime() - s.getTime()) / 3600000;

            // format time range
            const formatTime = (date: Date) => {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
            };
            const timeRangeText = `${formatTime(s)} - ${formatTime(e)}`;

            // skip tasks that end before 6am
            if (startPos + duration < 0) return null; 

            // calculate display positions
            const displayTop = startPos < 0 ? 0 : startPos * 50;
            const realDuration = startPos < 0 ? duration + startPos : duration;
            const displayHeight = realDuration * 50;

            if (displayHeight <= 0) return null;

            return (
                <div key={t.id} onClick={() => openTaskModal(t)} 
                    style={{
                        position: 'absolute', 
                        left: '60px', right: '10px', 
                        top: `${displayTop}px`, 
                        height: `${displayHeight}px`, 
                        background: '#ffebeb', 
                        borderLeft: '4px solid #b22222', 
                        padding: '2px 8px', fontSize: '11px', cursor: 'pointer', 
                        borderRadius: '4px', overflow: 'hidden', zIndex: 10,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                    }}>
                    <div style={{fontWeight:'bold', color:'#b22222'}}>
                        {t.job_code || 'No Code'} <span style={{color:'#555', fontWeight:'normal'}}>({timeRangeText})</span>
                    </div>
                    <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {t.task_description}
                    </div>
                </div>
            );
        });
    };

    // --- TASK MODAL LOGIC ---
    const openTaskModal = (task: any = null) => {
        setModalTaskOpen(true);
        let defaultDept = user?.department || ''; 
        if (user?.role === 'admin_total' && !task && departments.length > 0) {
            defaultDept = departments[0].id;
        }

        // Hint Box: Show today's job history
        if (tasks.length > 0) {
            const uniqueJobs = Array.from(new Set(tasks.map(t => t.job_code)));
            setTodayJobHistory(uniqueJobs.join(', '));
        } else {
            setTodayJobHistory('');
        }

        if (task) {
            setCurrentTaskId(task.id);
            const taskDept = task.department || defaultDept;
            // Parse time safely
            let sTime = '08:00', eTime = '17:00';
            try {
                sTime = new Date(task.start_time).toTimeString().substr(0,5);
                eTime = new Date(task.end_time).toTimeString().substr(0,5);
            } catch(e) { console.error("Time parse error", e); }

            setTaskFormData({ 
                department: taskDept, job_code: task.job_code, description: task.task_description, 
                start: sTime, end: eTime 
            });
            setSelectedJob(task.job_code); 
            loadJobsByDept(taskDept, 'USER');
        } else {
            setCurrentTaskId(null);
            setTaskFormData({ department: defaultDept, job_code: '', description: '', start: '08:00', end: '17:00' });
            setSelectedJob(null); 
            if(defaultDept) loadJobsByDept(defaultDept, 'USER');
        }
    };

    // --- HANDLE MODAL CHANGES & SAVE ---
    const handleModalDeptChange = (newDeptVal: string) => {
        setTaskFormData(prev => ({ ...prev, department: newDeptVal, job_code: '' }));
        setSelectedJob(null);
        loadJobsByDept(newDeptVal, 'USER');
    }

        // --- SAVE TASK WITH FIXES ---
const handleSaveTask = async () => {
    if (!selectedJob) return alert("Chưa chọn Job!");
    
    const sVal = taskFormData.start.split(':');
    const eVal = taskFormData.end.split(':');
    
    const dS = new Date(currentDate); 
    dS.setHours(parseInt(sVal[0]), parseInt(sVal[1]), 0, 0);
    
    const dE = new Date(currentDate); 
    dE.setHours(parseInt(eVal[0]), parseInt(eVal[1]), 0, 0);
    
    if(dS >= dE) return alert("Giờ kết thúc phải lớn hơn bắt đầu");

    const payload = { 
        task_id: currentTaskId, 
        department: taskFormData.department, 
        job_code: selectedJob, 
        task_description: taskFormData.description, 
        start_time: dS.toISOString(), 
        end_time: dE.toISOString(),   
        date: getLocalISODate(currentDate) 
    };

    const token = localStorage.getItem('token');  
    
    try {
        const response = await fetch('http://localhost:3000/api/tasks/save', { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Add auth header
            }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Lỗi lưu task');
            return;
        }
        
        setModalTaskOpen(false); 
        await loadTasks();  // Wait for reload
    } catch (error) {
        console.error('Save error:', error);
        alert('Lỗi kết nối server');
    }
};
    // --- DELETE TASK ---
    const handleDeleteTask = async () => {
        if (!currentTaskId || !confirm("Xóa task này?")) return;
        await fetch('http://localhost:3000/api/tasks/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ task_id: currentTaskId }) });
        setModalTaskOpen(false); loadTasks();
    };

    // --- ADMIN LOGIC ---
    const handleCreateJob = async () => {
        if (!adminSelectedDept || !newJobData.code) return alert("Vui lòng chọn phòng và nhập mã Job");
        const res = await fetch('http://localhost:3000/api/job-codes/save', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ department: adminSelectedDept, job_code: newJobData.code, task_description: newJobData.desc })
        });
        if (res.ok) { setNewJobData({ code: '', desc: '' }); loadJobsByDept(adminSelectedDept, 'ADMIN'); alert("Đã tạo Job Code"); } else alert("Lỗi tạo Job");
    };

    // --- DELETE JOB ---
    const handleDeleteJob = async (id: string) => {
        if(!confirm("Xóa Job Code này?")) return;
        await fetch('http://localhost:3000/api/job-codes/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ job_id: id }) });
        loadJobsByDept(adminSelectedDept, 'ADMIN');
    };

    // --- DEPARTMENT MANAGEMENT ---
    const handleAddDept = async () => {
        if(!newDeptName) return; const res = await fetch('http://localhost:3000/api/departments/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: newDeptName }) });
        if(res.ok) { setNewDeptName(''); loadDepartments(); }
    };

    // --- UPDATE DEPARTMENT ---
    const handleUpdateDept = async (id: string, newName: string) => {
        if(!confirm("Cập nhật tên?")) return; await fetch('http://localhost:3000/api/departments/update', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id, name: newName }) }); loadDepartments();
    };

    // --- DELETE DEPARTMENT ---
    const handleDeleteDept = async (id: string) => {
        if(!confirm("Xóa phòng?")) return; const res = await fetch('http://localhost:3000/api/departments/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id }) });
        if(res.ok) loadDepartments(); else alert("Không xóa được");
    };

    // --- REPORT LOGIC ---
    const openReportModal = async (type: 'USER' | 'JOB') => {
        setReportConfig(prev => ({ ...prev, type }));
        setModalReportOpen(true);
        if (type === 'USER' && reportUsers.length === 0) {
            const res = await fetch('http://localhost:3000/api/users/all'); 
            setReportUsers(await res.json());
        }
    };

    // --- DOWNLOAD REPORT ---
    const handleDownloadReport = () => {
        if (reportConfig.type === 'USER' && !reportConfig.userId) return alert("Vui lòng chọn nhân viên!");
        const baseUrl = 'http://localhost:3000/api/reports';
        const endpoint = reportConfig.type === 'USER' ? 'user-report' : 'job-report';
        const query = `?month=${reportConfig.month}&year=${reportConfig.year}&userId=${reportConfig.userId}`;
        window.open(baseUrl + '/' + endpoint + query, '_blank');
    };

    // --- GET DEPARTMENT NAME ---
    const getDeptName = (idOrCode: string) => {
        const dept = departments.find(d => d.id === idOrCode || d.code === idOrCode);
        return dept ? dept.name : idOrCode;
    };

    // --- RENDER ---
    if (!user) return <div>Loading...</div>;
    const isAdmin = user.role.includes('admin');
    const isTotalAdmin = user.role === 'admin_total';

    return (
        <div className="dashboard-body">
            <div className="dash-header">
                <h1>TÍN VIỆT TIMESHEET</h1>
                <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                    {user.username} ({user.role}) ▼
                    {showUserMenu && ( <div className="user-dropdown"> <button onClick={() => { localStorage.clear(); navigate('/login'); }}>Đăng xuất</button> </div> )}
                </div>
            </div>
            <a href="https://forms.gle/yxhx5kWoTJXS1VXv7" target="_blank" className="btn-feedback" rel="noreferrer">🐞</a>

            <div className="dash-container">
                <div className="main-panel">
                    <div className="date-nav">
                        <button className="btn-nav" onClick={() => handleAddDays(-1)}>❮ Hôm qua</button>
                        <h2>{currentDate.toLocaleDateString('vi-VN')}</h2>
                        <button className="btn-nav" onClick={() => handleAddDays(1)}>Ngày mai ❯</button>
                    </div>
                    <div className="task-list" style={{ position: 'relative' }}>
                        {renderTimeSlots()}
                        {renderTasksOnTimeline()}
                    </div>
                    <button className="btn-add" onClick={() => openTaskModal(null)}>+ Khai báo công việc</button>
                </div>

                {/* ADMIN PANEL */}
                {isAdmin && (
                    <div className="admin-panel" style={{display: 'flex'}}>
                        <h3 style={{color: '#b22222', borderBottom: '1px solid #eee'}}>QUẢN TRỊ VIÊN</h3>
                        <div className="report-control">
                            <label><strong>QUẢN LÝ JOBCODE</strong></label>
                            {isTotalAdmin ? (
                                <select className="admin-input" value={adminSelectedDept} onChange={(e) => { setAdminSelectedDept(e.target.value); loadJobsByDept(e.target.value, 'ADMIN'); }}>
                                    <option value="">-- Chọn Phòng Ban --</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            ) : ( <input className="admin-input" value={getDeptName(user.department)} disabled style={{background: '#eee', color: '#333', fontWeight: 'bold'}} /> )}
                            
                            <div style={{marginTop:'5px'}}>
                                <input className="admin-input" placeholder="Mã (VD: KT01)" value={newJobData.code} onChange={e => setNewJobData({...newJobData, code: e.target.value})} />
                                <input className="admin-input" placeholder="Tên công việc" value={newJobData.desc} onChange={e => setNewJobData({...newJobData, desc: e.target.value})} />
                            </div>
                            <button className="btn-action" onClick={handleCreateJob} style={{marginBottom:'15px'}}>+ Tạo Job Mới</button>

                            <label><strong>DANH SÁCH JOB</strong></label>
                            <div style={{height: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #eee', padding:'5px'}}>
                                {adminJobList.map(j => (
                                    <div key={j.id} className="job-manage-item">
                                        <div><div style={{fontWeight:'bold', color:'#b22222'}}>{j.job_code}</div><div style={{fontSize:'0.85em'}}>{j.task_description}</div></div>
                                        <button className="btn-del-job" onClick={() => handleDeleteJob(j.id)}>Xóa</button>
                                    </div>
                                ))}
                            </div>
                        </div>
{isTotalAdmin && (
    <div className="report-control">
        <label><strong>XUẤT BÁO CÁO</strong></label>
        <div style={{display:'flex', gap:'5px'}}>
            <button className="btn-action" style={{background:'#2ecc71'}} onClick={() => openReportModal('USER')}>Theo NV</button>
            <button className="btn-action" style={{background:'#3498db'}} onClick={() => openReportModal('JOB')}>Theo Job</button>
        </div>
    </div>
)}
                        <div className="report-control">
                            <label><strong>HỆ THỐNG</strong></label>
                            <button className="btn-action" style={{background:'#8e44ad', marginBottom:'5px'}} onClick={() => navigate('/admin/users')}>Quản lý Tài khoản</button>
                            {isTotalAdmin && ( <button className="btn-action" style={{background:'#f39c12'}} onClick={() => setModalDeptOpen(true)}>🏢 Quản lý Phòng Ban</button> )}
                        </div>
                    </div>
                )}
            </div>

            {/* TASK MODAL */}
            {modalTaskOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{color:'#b22222', marginTop:0}}>Khai báo công việc</h2>
                        
                        {/* HINT BOX */}
                        {todayJobHistory && (
                            <div style={{
                                background: '#e1f5fe', 
                                color: '#0277bd', 
                                padding: '8px 12px', 
                                borderRadius: '4px', 
                                fontSize: '0.9em', 
                                marginBottom: '15px', 
                                borderLeft: '4px solid #039be5'
                            }}>
                                ℹ️ Job đã làm hôm nay: <b>{todayJobHistory}</b>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Phòng ban</label>
                            {isTotalAdmin ? (
                                <select value={taskFormData.department} onChange={(e) => handleModalDeptChange(e.target.value)}>
                                    {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                                </select>
                            ) : ( <input value={getDeptName(taskFormData.department)} disabled style={{background: '#f0f0f0', color: '#333', fontWeight:'bold'}} /> )}
                        </div>
                        <div className="form-group">
                            <label>Chọn Job Code</label>
                            <div style={{maxHeight:'200px', overflowY:'auto', border:'1px solid #eee'}}>
                                <table className="job-table">
                                    <thead><tr><th>Mã</th><th>Nội dung</th><th>Chọn</th></tr></thead>
                                    <tbody>
                                        {jobs.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>Không có Job Code nào</td></tr>}
                                        {jobs.map(j => (
                                            <tr key={j.id} className={selectedJob === j.job_code ? 'selected-row' : ''}>
                                                <td><b>{j.job_code}</b></td><td>{j.task_description}</td><td><button onClick={() => setSelectedJob(j.job_code)} style={{cursor:'pointer'}}>Chọn</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="form-group" style={{display:'flex', gap:'15px'}}>
                            <div style={{flex:1}}><label>Bắt đầu</label><input type="time" value={taskFormData.start} onChange={e => setTaskFormData({...taskFormData, start: e.target.value})} /></div>
                            <div style={{flex:1}}><label>Kết thúc</label><input type="time" value={taskFormData.end} onChange={e => setTaskFormData({...taskFormData, end: e.target.value})} /></div>
                        </div>
                        <div className="form-group"><label>Chi tiết</label><textarea rows={2} value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} /></div>
                        <div style={{textAlign:'right', marginTop:'10px'}}>
                            <button onClick={() => setModalTaskOpen(false)} style={{padding:'10px', marginRight:'5px'}}>Hủy</button>
                            {currentTaskId && <button onClick={handleDeleteTask} style={{padding:'10px', background:'#757575', color:'white', marginRight:'5px', border:'none'}}>Xóa</button>}
                            <button onClick={handleSaveTask} style={{padding:'10px 20px', background:'#b22222', color:'white', border:'none'}}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT MODAL */}
            {modalReportOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '400px'}}>
                        <h3 style={{color:'#b22222', marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>Xuất Báo Cáo {reportConfig.type === 'USER' ? 'Nhân viên' : 'Job'}</h3>
                        <div className="form-group" style={{display:'flex', gap:'15px'}}>
                            <div style={{flex:1}}><label>Tháng</label><input type="number" min="1" max="12" value={reportConfig.month} onChange={e => setReportConfig({...reportConfig, month: parseInt(e.target.value)})} /></div>
                            <div style={{flex:1}}><label>Năm</label><input type="number" value={reportConfig.year} onChange={e => setReportConfig({...reportConfig, year: parseInt(e.target.value)})} /></div>
                        </div>
                        {reportConfig.type === 'USER' && (
                            <div className="form-group">
                                <label>Chọn Nhân viên</label>
                                <select style={{width:'100%', height:'150px'}} multiple={false} size={5} value={reportConfig.userId} onChange={e => setReportConfig({...reportConfig, userId: e.target.value})}>
                                    {reportUsers.map(u => (<option key={u.id} value={u.id}>{u.username} ({u.role})</option>))}
                                </select>
                            </div>
                        )}
                        <div style={{textAlign:'right', marginTop:'20px'}}>
                            <button onClick={() => setModalReportOpen(false)} style={{padding:'8px 15px', border:'1px solid #ccc', background:'white', borderRadius:'4px', cursor:'pointer'}}>Đóng</button>
                            <button onClick={handleDownloadReport} style={{padding:'8px 15px', background:'#2ecc71', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', marginLeft:'5px'}}>⬇ Tải Excel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEPARTMENT MODAL */}
            {modalDeptOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{width: '600px'}}>
                        <h2 style={{color: '#f39c12', marginTop: 0, display:'flex', justifyContent:'space-between'}}>Quản lý Phòng Ban <span onClick={() => setModalDeptOpen(false)} style={{cursor: 'pointer', color: '#999'}}>✖</span></h2>
                        <div style={{background:'#fff3e0', padding:'15px', borderRadius:'6px', marginBottom:'15px', display:'flex', gap:'10px', border:'1px solid #ffe0b2'}}>
                            <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Nhập tên phòng ban mới..." style={{flex:1, padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                            <button onClick={handleAddDept} style={{padding:'8px 15px', background:'#e65100', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Thêm Mới</button>
                        </div>
                        <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px'}}>
                            {departments.map(d => (
                                <div key={d.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee'}}>
                                    <div style={{flex:1, display: 'flex', alignItems: 'center'}}><input defaultValue={d.name} onBlur={(e) => handleUpdateDept(d.id, e.target.value)} style={{border: '1px solid transparent', padding: '4px', width: '60%', fontWeight: 500}} /><span style={{fontSize: '0.85rem', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px'}}>{d.code}</span></div>
                                    <button onClick={() => handleDeleteDept(d.id)} style={{color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>🗑 Xóa</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}