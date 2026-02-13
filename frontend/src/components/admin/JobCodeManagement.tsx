//frontend/src/components/admin/JobCodeManagement.tsx
// this file contains the Job Code Management component for admin users
// and includes fixes for department name retrieval and job code operations
import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { jobCodeService } from '../../services/jobCode.service';

export const JobCodeManagement = () => {
    const { user } = useAuthStore();
    const { departments, fetchDepartments } = useUserStore();
    const { jobCodes, fetchJobCodes } = useTaskStore();
    
    const [adminSelectedDept, setAdminSelectedDept] = useState('');
    const [newJobData, setNewJobData] = useState({ code: '', desc: '' });

    const isTotalAdmin = user?.role === 'admin_total';

    //function to get department name of current user
    const getMyDeptName = () => {
        if (!user) return 'Chưa đăng nhập';
        if (typeof user.department === 'object' && user.department !== null) {
            return (user.department as any).name || 'Phòng không tên';
        }
        if (typeof user.department === 'string') {
            if (user.department.length < 20 || user.department.includes(' ')) return user.department;
        }
        const d = departments.find(dept => dept.id === user.department);
        return d ? d.name : 'Phòng của tôi';
    };

    const myDeptId = user?.departmentId || (typeof user?.department === 'string' ? user.department : (user?.department as any)?.id);

    //function to fetch job codes on mount or when relevant data changes
    useEffect(() => {
        if (isTotalAdmin) {
            fetchDepartments();
        } else if (myDeptId) {
            fetchJobCodes(myDeptId);
        }
    }, [user]);

    //fetch job codes when admin changes selected department
    useEffect(() => {
        if (isTotalAdmin && adminSelectedDept) {
            fetchJobCodes(adminSelectedDept);
        }
    }, [adminSelectedDept]);

    //function to handle creating a new job code
    const handleCreateJob = async () => {
        const deptId = isTotalAdmin ? adminSelectedDept : myDeptId;
        if (!deptId) return alert("Vui lòng chọn phòng ban trước!");
        if (!newJobData.code || !newJobData.desc) return alert("Thiếu thông tin job!");

        try {
            await jobCodeService.create({
                department: deptId,
                job_code: newJobData.code,
                task_description: newJobData.desc
            });
            setNewJobData({ code: '', desc: '' });
            fetchJobCodes(deptId);
        } catch (e) { alert('Lỗi tạo job'); }
    };

    //function to handle deleting a job code
    const handleDeleteJob = async (id: string) => {
        if(!confirm("Xóa job này?")) return;
        const deptId = isTotalAdmin ? adminSelectedDept : myDeptId;
        try {
            await jobCodeService.delete(id);
            if(deptId) fetchJobCodes(deptId);
        } catch(e) { alert("Không thể xóa job đang dùng"); }
    };

    //render component
    return (
        <div className="admin-card">
            {isTotalAdmin && (
                <div style={{marginBottom: '15px'}}>
                    <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333'}}>Chọn Phòng Ban Quản Lý:</label>
                    <select 
                        className="admin-input" 
                        value={adminSelectedDept} 
                        onChange={e => setAdminSelectedDept(e.target.value)}
                        aria-label="Chọn phòng ban để quản lý Job Code"
                    >
                        <option value="">-- Chọn phòng --</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {(!isTotalAdmin || adminSelectedDept) && (
                <>
                    <label><strong>TẠO JOBCODE ({isTotalAdmin ? 'Cho phòng đã chọn' : getMyDeptName()})</strong></label>
                    
                    <div style={{display:'flex', flexDirection: 'column', gap:'10px', marginBottom:'15px'}}>
                        <input 
                            className="admin-input" 
                            placeholder="Mã Job code (VD: KT2004)" 
                            value={newJobData.code} 
                            onChange={e => setNewJobData({...newJobData, code: e.target.value})} 
                            aria-label="Mã Job mới" 
                            style={{padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px'}}
                        />
                        <input 
                            className="admin-input" 
                            placeholder="Mô tả jobcode" 
                            value={newJobData.desc} 
                            onChange={e => setNewJobData({...newJobData, desc: e.target.value})} 
                            aria-label="Mô tả Job mới" 
                            style={{padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px'}}
                        />
                    </div>
                    
                    <button className="btn-action" onClick={handleCreateJob} style={{marginBottom:'15px', padding: '10px 20px', fontSize: '1rem'}}>+ Tạo Job Mới</button>
                </>
            )}

            <label><strong>DANH SÁCH JOB</strong></label>
            <div style={{height: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #eee', padding:'5px'}}>
                {jobCodes.length === 0 && <p style={{color:'#555', fontSize:'0.9rem', textAlign:'center', padding:'10px'}}>Chưa có dữ liệu.</p>}
                
                {jobCodes.map(j => (
                    <div key={j.id} className="job-manage-item" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                        <div>
                            <div style={{fontWeight:'bold', color:'#b22222'}}>{j.job_code}</div>
                            <div style={{fontSize:'0.9em', color:'#333'}}>{j.task_description}</div>
                        </div>
                        {(isTotalAdmin || user?.role === 'admin_dept') && (
                            <button className="btn-del-job" onClick={() => handleDeleteJob(j.id)} style={{color:'#d32f2f', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Xóa</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};