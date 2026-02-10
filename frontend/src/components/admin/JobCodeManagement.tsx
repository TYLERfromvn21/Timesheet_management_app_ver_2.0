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

    // function to get my department name
    const getMyDeptName = () => {
        if (!user) return 'Chưa đăng nhập';
        
        // 1.take from Object
        if (typeof user.department === 'object' && user.department !== null) {
            return (user.department as any).name || 'Phòng không tên';
        }
        // 2. take from string directly
        if (typeof user.department === 'string') {
            if (user.department.length < 20 || user.department.includes(' ')) return user.department;
        }
        // 3. Fallback: find in departments list
        if (departments.length > 0) {
            const d = departments.find(dept => dept.id === user.departmentId || dept.id === user.department);
            if (d) return d.name;
        }
        return 'Phòng của tôi';
    };

    // Fetch departments on mount
    useEffect(() => {
        if (isTotalAdmin) fetchDepartments();
        
        // Logic for admin_dept to set their own department
        if (user && !isTotalAdmin) {
            const myDeptId = user.departmentId || (typeof user.department === 'object' ? (user.department as any).id : user.department);
            if (myDeptId) {
                setAdminSelectedDept(myDeptId);
                fetchJobCodes(myDeptId);
            }
        }
    }, [user]);

    //function to handle department change
    const handleDeptChange = (deptId: string) => {
        setAdminSelectedDept(deptId);
        if(deptId) fetchJobCodes(deptId);
    };

    //function to handle create new job code
    const handleCreateJob = async () => {
        if (!adminSelectedDept) return alert("Vui lòng chọn phòng ban trước!");
        if (!newJobData.code) return alert("Vui lòng nhập Mã Job!");
        
        try {
            await jobCodeService.create({
                department: adminSelectedDept,
                job_code: newJobData.code,
                task_description: newJobData.desc
            });
            setNewJobData({ code: '', desc: '' });
            fetchJobCodes(adminSelectedDept);
            alert("Đã tạo Job Code thành công!");
        } catch (e: any) {
            alert(e.message || "Lỗi tạo Job");
        }
    };

    //function to handle delete job code
    const handleDeleteJob = async (id: string) => {
        if(!confirm("Xóa Job Code này?")) return;
        try {
            await jobCodeService.delete(id);
            fetchJobCodes(adminSelectedDept);
        } catch (e) { alert("Lỗi xóa Job"); }
    };

    return (
        <div className="report-control">
            <label><strong>QUẢN LÝ JOBCODE</strong></label>
            {isTotalAdmin ? (
                // Admin Total Dropdown
                <select className="admin-input" value={adminSelectedDept} onChange={(e) => handleDeptChange(e.target.value)}>
                    <option value="">-- Chọn Phòng Ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            ) : ( 
                // Admin Dept - show own department
                <input 
                    className="admin-input" 
                    value={getMyDeptName()} 
                    disabled 
                    style={{background: '#eee', color: '#333', fontWeight: 'bold'}} 
                /> 
            )}
            
            {(isTotalAdmin || user?.role === 'admin_dept') && (
                <>
                    <div style={{marginTop:'5px'}}>
                        <input className="admin-input" placeholder="Mã (VD: KT01)" value={newJobData.code} onChange={e => setNewJobData({...newJobData, code: e.target.value})} />
                        <input className="admin-input" placeholder="Tên công việc" value={newJobData.desc} onChange={e => setNewJobData({...newJobData, desc: e.target.value})} />
                    </div>
                    <button className="btn-action" onClick={handleCreateJob} style={{marginBottom:'15px'}}>+ Tạo Job Mới</button>
                </>
            )}

            <label><strong>DANH SÁCH JOB</strong></label>
            <div style={{height: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #eee', padding:'5px'}}>
                {jobCodes.length === 0 && <p style={{color:'#999', fontSize:'0.8rem', textAlign:'center', padding:'10px'}}>Chưa có dữ liệu.</p>}
                {jobCodes.map(j => (
                    <div key={j.id} className="job-manage-item" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                        <div>
                            <div style={{fontWeight:'bold', color:'#b22222'}}>{j.job_code}</div>
                            <div style={{fontSize:'0.85em'}}>{j.task_description}</div>
                        </div>
                        {(isTotalAdmin || user?.role === 'admin_dept') && (
                            <button className="btn-del-job" onClick={() => handleDeleteJob(j.id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Xóa</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};