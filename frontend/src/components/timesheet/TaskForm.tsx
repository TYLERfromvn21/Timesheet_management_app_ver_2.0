// frontend/src/components/timesheet/TaskForm.tsx
// This component provides a form for creating and editing tasks,
// allowing users to select department, job code, description, and time range.

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

import { JobSelectionTable } from './JobSelectionTable'; 
import '../../styles/dashboard.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editTask?: any; 
    date: Date;
}

export const TaskForm: React.FC<Props> = ({ isOpen, onClose, editTask, date }) => {
    const { user } = useAuthStore();
    const { jobCodes, saveTask, fetchJobCodes, deleteTask, tasks } = useTaskStore();
    const { departments, fetchDepartments } = useUserStore();
    
    const [formData, setFormData] = useState({
        department: '', 
        jobCode: '',
        desc: '', 
        startTime: '08:00',
        endTime: '17:00'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [todayJobHistory, setTodayJobHistory] = useState('');

    const getSafeTimeStr = (isoString: string) => {
        if (!isoString) return '08:00';
        try {
            const timePart = isoString.split('T')[1]; 
            if (timePart) return timePart.substring(0, 5);
            return '08:00';
        } catch (e) { return '08:00'; }
    };

    const isTotalAdmin = user?.role === 'admin_total';
    const myDeptIds = user?.departmentIds || (user?.departmentId ? [user.departmentId] : []);
    const allowedDepts = isTotalAdmin ? departments : departments.filter(d => myDeptIds.includes(d.id));

    //function to initialize form data when opening the modal,
    //  and also to fetch job codes based on the selected department.
    useEffect(() => {
        if (isOpen) {
            if (departments.length === 0) fetchDepartments();
            
            if (tasks.length > 0) {
                const uniqueJobs = Array.from(new Set(tasks.map((t: any) => t.job_code))).filter(Boolean);
                setTodayJobHistory(uniqueJobs.join(', '));
            } else {
                setTodayJobHistory('');
            }

            if (editTask) {
                const sTime = getSafeTimeStr(editTask.start_time);
                const eTime = getSafeTimeStr(editTask.end_time);
                const deptId = editTask.department || (allowedDepts.length > 0 ? allowedDepts[0].id : '');

                setFormData({
                    department: deptId,
                    jobCode: editTask.job_code, 
                    desc: editTask.task_description, 
                    startTime: sTime,
                    endTime: eTime
                });
                if (deptId) fetchJobCodes(deptId);
            } else {
                const defaultDeptId = allowedDepts.length > 0 ? allowedDepts[0].id : '';
                setFormData({ 
                    department: defaultDeptId, 
                    jobCode: '', 
                    desc: '', 
                    startTime: '08:00', 
                    endTime: '17:00' 
                });
                if (defaultDeptId) fetchJobCodes(defaultDeptId);
            }
        }
    }, [editTask, isOpen]);

    //function to handle changes in the department selection within the modal
    const handleModalDeptChange = (newDeptVal: string) => {
        setFormData(prev => ({ ...prev, department: newDeptVal, jobCode: '' }));
        if (newDeptVal) fetchJobCodes(newDeptVal);
    };

    //function to handle job selection from the JobSelectionTable component
    const handleSelectJob = (job: any) => {
        const code = job.job_code; 
        if (!code) return;
        setFormData(prev => ({ ...prev, jobCode: code, department: job.department || prev.department }));
    };

    //function to handle form submission,
    // including validation and API calls to save the task.
    const handleSubmit = async () => {
        if (!formData.department) return alert("Vui lòng chọn Phòng ban");
        if (!formData.jobCode) return alert("Chưa chọn Mã Job (Vui lòng nhấn nút 'Chọn' trong bảng)");
        if (formData.endTime <= formData.startTime) return alert("Giờ kết thúc phải lớn hơn giờ bắt đầu");

        setIsLoading(true);
        try {
            const startFull = new Date(date);
            const [sH, sM] = formData.startTime.split(':').map(Number);
            startFull.setHours(sH, sM, 0, 0);

            const endFull = new Date(date);
            const [eH, eM] = formData.endTime.split(':').map(Number);
            endFull.setHours(eH, eM, 0, 0);

            const payload: any = {
                task_id: editTask?.task_id, 
                userId: user!.id,
                department: formData.department,
                job_code: formData.jobCode, 
                task_description: formData.desc,
                start_time: startFull,
                end_time: endFull,
                date: date
            };

            await saveTask(payload);
            onClose(); 
        } catch (error: any) {
            alert(error.response?.data?.error || error.message || "Lỗi lưu task");
        } finally {
            setIsLoading(false);
        }
    };

    //function to handle task deletion, with a confirmation prompt before proceeding.
    const handleDelete = async () => {
        if (!confirm("Bạn muốn xóa task này?")) return;
        try {
            await deleteTask(editTask.task_id, user!.id);
            onClose();
        } catch (e) { alert("Lỗi xóa task"); }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ color: '#b22222', marginTop: 0 }}>
                    {editTask ? 'CẬP NHẬT CÔNG VIỆC' : 'KHAI BÁO CÔNG VIỆC MỚI'}
                </h3>
                
                {todayJobHistory && (
                    <div style={{background: '#e1f5fe', color: '#0277bd', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9em', marginBottom: '15px', borderLeft: '4px solid #039be5'}}>
                        ℹ️ Job đã làm hôm nay: <b>{todayJobHistory}</b>
                    </div>
                )}

                <div className="form-group">
                    <label>Phòng ban</label>
                    {isTotalAdmin || allowedDepts.length > 1 ? (
                        <select 
                            value={formData.department} 
                            onChange={(e) => handleModalDeptChange(e.target.value)}
                            style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
                        >
                            <option value="">-- Chọn Phòng Ban --</option>
                            {allowedDepts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    ) : ( 
                        <input 
                            value={allowedDepts.length > 0 ? allowedDepts[0].name : ''} 
                            disabled 
                            style={{width:'100%', padding:'8px', background:'#f0f0f0', color:'#333', fontWeight:'bold', border:'1px solid #ccc', borderRadius:'4px'}} 
                        /> 
                    )}
                </div>

                <div className="form-group">
                    <label>Chọn Job Code: <span style={{color: '#b22222', fontWeight:'bold'}}>{formData.jobCode || '(Chưa chọn)'}</span></label>
                    
                    <JobSelectionTable 
                        jobCodes={jobCodes} 
                        selectedJobCode={formData.jobCode} 
                        selectedDepartment={formData.department} 
                        onSelectJob={handleSelectJob} 
                    />

                </div>

                <div className="form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea 
                        rows={3}
                        value={formData.desc} 
                        onChange={e => setFormData({...formData, desc: e.target.value})}
                        style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px', fontFamily: 'inherit'}}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Bắt đầu</label>
                        <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Kết thúc</label>
                        <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '15px' }}>
                    <button onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px', border: 'none', background: '#eee', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    {editTask && <button onClick={handleDelete} style={{ marginRight: '10px', padding: '8px 15px', border: 'none', background: '#757575', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>}
                    <button onClick={handleSubmit} disabled={isLoading} className="create-btn" style={{ width: 'auto', padding: '8px 25px', background: '#b22222', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold' }}>{isLoading ? 'Đang lưu...' : 'Lưu Lại'}</button>
                </div>
            </div>
        </div>
    );
};