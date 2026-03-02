//frontend/src/components/admin/JobCodeManagement.tsx
// this file contains the Job Code Management component for admin users
// and includes fixes for department name retrieval and job code operations

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { jobCodeService } from '../../services/jobCode.service';

import { CreateJobCodeForm } from './CreateJobCodeForm';
import { JobCodeList } from './JobCodeList';

export const JobCodeManagement = () => {
    const { user } = useAuthStore();
    const { departments, fetchDepartments } = useUserStore();
    const { jobCodes, fetchJobCodes } = useTaskStore();
    
    const [selectedDept, setSelectedDept] = useState('');
    const [newJobData, setNewJobData] = useState({ code: '', desc: '' });

    const isTotalAdmin = user?.role === 'admin_total';
    const myDeptIds = user?.departmentIds || [];

    const manageableDepts = isTotalAdmin 
        ? departments 
        : departments.filter(d => myDeptIds.includes(d.id));

        //function to get department name by id, with fallback to id if not found
    useEffect(() => {
        fetchDepartments();
        if (!isTotalAdmin && myDeptIds.length === 1 && !selectedDept) {
            setSelectedDept(myDeptIds[0]);
        }
    }, [user, myDeptIds]);

    //function to fetch job codes when selected department changes or on initial load
    useEffect(() => {
        if (selectedDept) {
            fetchJobCodes(selectedDept);
        } else if (!isTotalAdmin && myDeptIds.length > 0) {
            fetchJobCodes(myDeptIds.join(','));
        }
    }, [selectedDept, isTotalAdmin, myDeptIds.length]);

    //function to handle creating a new job code, with validation and error handling
    const handleCreateJob = async () => {
        const targetDept = selectedDept || (myDeptIds.length === 1 ? myDeptIds[0] : '');

        if (!targetDept) return alert("Vui lòng chọn 1 phòng ban cụ thể để tạo Job!");
        if (!newJobData.code || !newJobData.desc) return alert("Thiếu thông tin job!");

        try {
            await jobCodeService.create({
                department: targetDept,
                job_code: newJobData.code,
                task_description: newJobData.desc
            });
            setNewJobData({ code: '', desc: '' });
            fetchJobCodes(targetDept);
        } catch (e) { alert('Lỗi tạo job (Có thể mã trùng)'); }
    };

    //function to handle deleting a job code, with confirmation and error handling
    const handleDeleteJob = async (id: string) => {
        if(!confirm("Xóa job này?")) return;
        try {
            await jobCodeService.delete(id);
            if(selectedDept) fetchJobCodes(selectedDept);
            else if (myDeptIds.length > 0) fetchJobCodes(myDeptIds.join(','));
        } catch(e) { alert("Không thể xóa job đang dùng"); }
    };

    //render the component with department selection, 
    // create job form, and job code list, with conditional rendering based on user role and department selection
    return (
        <div className="admin-card">
            {(isTotalAdmin || manageableDepts.length > 1) && (
                <div style={{marginBottom: '15px'}}>
                    <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#333'}}>
                        Chọn Phòng Ban:
                    </label>
                    <select 
                        className="admin-input" 
                        value={selectedDept} 
                        onChange={e => setSelectedDept(e.target.value)}
                    >
                        <option value="">-- {isTotalAdmin ? 'Chọn phòng' : 'Tất cả phòng của tôi'} --</option>
                        {manageableDepts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Component Create Job */}
            {(selectedDept || myDeptIds.length === 1) && (
                <CreateJobCodeForm 
                    newJobData={newJobData} 
                    setNewJobData={setNewJobData} 
                    onCreateJob={handleCreateJob} 
                />
            )}

            <JobCodeList 
                jobCodes={jobCodes} 
                isTotalAdmin={isTotalAdmin} 
                userRole={user?.role} 
                onDeleteJob={handleDeleteJob} 
            />
        </div>
    );
};