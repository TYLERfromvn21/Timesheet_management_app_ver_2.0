// frontend/src/components/admin/JobCodeList.tsx
// this file defines the JobCodeList component which displays a list of job codes and their descriptions
// it also includes a delete button for each job code, which is conditionally rendered based on the user's role.
import React from 'react';

interface JobCodeListProps {
    jobCodes: any[];
    isTotalAdmin: boolean;
    userRole?: string;
    onDeleteJob: (id: string) => void;
}

export const JobCodeList: React.FC<JobCodeListProps> = ({ jobCodes, isTotalAdmin, userRole, onDeleteJob }) => {
    return (
        <>
            <label><strong>DANH SÁCH JOB</strong></label>
            <div style={{height: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #eee', padding:'5px'}}>
                {jobCodes.length === 0 && (
                    <p style={{color:'#555', fontSize:'0.9rem', textAlign:'center', padding:'10px'}}>Chưa có dữ liệu.</p>
                )}
                
                {jobCodes.map(j => (
                    <div key={j.id} className="job-manage-item" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                        <div>
                            <div style={{fontWeight:'bold', color:'#b22222'}}>{j.job_code}</div>
                            <div style={{fontSize:'0.9em', color:'#333'}}>{j.task_description}</div>
                        </div>
                        {(isTotalAdmin || userRole === 'admin_dept') && (
                            <button className="btn-del-job" onClick={() => onDeleteJob(j.id)} style={{color:'#d32f2f', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>
                                Xóa
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};