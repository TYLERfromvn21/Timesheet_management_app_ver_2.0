// frontend/src/components/timesheet/TaskForm.tsx
// This component provides a form for creating and editing tasks,
// allowing users to select department, job code, description, and time range.
import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
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
    
    // State form
    const [formData, setFormData] = useState({
        department: '', 
        jobCode: '',
        desc: '', 
        startTime: '08:00',
        endTime: '17:00'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [todayJobHistory, setTodayJobHistory] = useState('');

    // --- LOGIC TIME ---
    const getSafeTimeStr = (isoString: string) => {
        if (!isoString) return '08:00';
        try {
            const timePart = isoString.split('T')[1]; 
            if (timePart) return timePart.substring(0, 5);
            return '08:00';
        } catch (e) { return '08:00'; }
    };

    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // --- LOGIC DISPAY DEPT NAME ---
    const getDeptNameDisplay = (deptId: string) => {
        if (!deptId) return '';
        const dept = departments.find(d => d.id === deptId || d.code === deptId);
        if (dept) return dept.name;
        
        if (user && (user.departmentId === deptId || user.department === deptId)) {
            if (typeof user.department === 'object' && user.department) return (user.department as any).name;
            return user.department || deptId;
        }
        return deptId;
    };

    // function to get user's department id
    const getMyDeptId = () => {
        if (!user) return '';
        if (user.departmentId) return user.departmentId;
        if (typeof user.department === 'object' && user.department) return (user.department as any).id;
        return user.department; 
    };

    // Initialization
    useEffect(() => {
        if (isOpen) {
            if (departments.length === 0) fetchDepartments();
            
            // Hint Box
            if (tasks.length > 0) {
                // Set job history for today (snake_case)
                const uniqueJobs = Array.from(new Set(tasks.map((t: any) => t.job_code))).filter(Boolean);
                setTodayJobHistory(uniqueJobs.join(', '));
            } else {
                setTodayJobHistory('');
            }

            if (editTask) {
                const sTime = getSafeTimeStr(editTask.start_time);
                const eTime = getSafeTimeStr(editTask.end_time);
                const deptId = editTask.department || getMyDeptId() || '';

                setFormData({
                    department: deptId,
                    jobCode: editTask.job_code, // take job_code in snake_case
                    desc: editTask.task_description, // take task_description in snake_case
                    startTime: sTime,
                    endTime: eTime
                });
                if (deptId) fetchJobCodes(deptId);
            } else {
                // CREATE NEW
                const defaultDeptId = getMyDeptId() || '';
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

    //function to handle department change in modal
    const handleModalDeptChange = (newDeptVal: string) => {
        setFormData(prev => ({ ...prev, department: newDeptVal, jobCode: '' }));
        if (newDeptVal) fetchJobCodes(newDeptVal);
    };

    //function to handle job selection from the job codes table
    const handleSelectJob = (job: any) => {
        const code = job.job_code; 
        
        if (!code) {
            console.error("Job object missing job_code:", job);
            return;
        }

        setFormData(prev => ({ ...prev, jobCode: code }));
    };

    //function to handle form submission
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

    const handleDelete = async () => {
        if (!confirm("Bạn muốn xóa task này?")) return;
        try {
            await deleteTask(editTask.task_id, user!.id);
            onClose();
        } catch (e) { alert("Lỗi xóa task"); }
    };

    if (!isOpen) return null;

    const isTotalAdmin = user?.role === 'admin_total';

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
                    {isTotalAdmin ? (
                        <select 
                            value={formData.department} 
                            onChange={(e) => handleModalDeptChange(e.target.value)}
                            style={{width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
                        >
                            <option value="">-- Chọn Phòng Ban --</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    ) : ( 
                        <input 
                            value={getDeptNameDisplay(formData.department)} 
                            disabled 
                            style={{width:'100%', padding:'8px', background:'#f0f0f0', color:'#333', fontWeight:'bold', border:'1px solid #ccc', borderRadius:'4px'}} 
                        /> 
                    )}
                </div>

                {/* Table jobcode */}
                <div className="form-group">
                    <label>Chọn Job Code: <span style={{color: '#b22222', fontWeight:'bold'}}>{formData.jobCode || '(Chưa chọn)'}</span></label>
                    <div style={{maxHeight:'200px', overflowY:'auto', border:'1px solid #eee'}}>
                        <table className="job-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                            <thead>
                                <tr style={{background: '#f5f5f5', textAlign: 'left'}}>
                                    <th style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Mã</th>
                                    <th style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Nội dung</th>
                                    <th style={{padding: '8px', borderBottom: '1px solid #ddd', width: '70px'}}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobCodes.length === 0 && (
                                    <tr><td colSpan={3} style={{textAlign:'center', padding:'20px', color:'#888'}}>
                                        {formData.department ? "Không có Job nào trong phòng này" : "Vui lòng chọn phòng ban"}
                                    </td></tr>
                                )}
                                {jobCodes.map(j => {
                                    const code = j.job_code; 
                                    const desc = j.task_description;
                                    const isSelected = formData.jobCode === code;
                                    
                                    return (
                                        <tr key={j.id} style={{
                                            borderBottom: '1px solid #eee', 
                                            background: isSelected ? '#e3f2fd' : 'white',
                                            borderLeft: isSelected ? '4px solid #2196f3' : 'none'
                                        }}>
                                            <td style={{padding: '8px', fontWeight: 'bold', color: '#b22222'}}>{code}</td>
                                            <td style={{padding: '8px'}}>{desc}</td>
                                            <td style={{padding: '8px'}}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleSelectJob(j)} 
                                                    style={{
                                                        cursor:'pointer', padding: '4px 8px', 
                                                        background: isSelected ? '#2ecc71' : '#2196f3',
                                                        color: 'white', border: 'none', borderRadius: '4px'
                                                    }}
                                                >
                                                    {isSelected ? 'Đã Chọn' : 'Chọn'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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