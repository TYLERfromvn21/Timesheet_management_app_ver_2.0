// frontend/src/components/admin/CreateJobCodeForm.tsx
// this file contains the form for creating a new job code, 
// used in the AdminJobCodeManagement component. 
// It includes input fields for the job code and description, and a button to submit the new job code. The form is styled with basic CSS for better user experience.
import React from 'react';

interface CreateJobCodeFormProps {
    newJobData: { code: string; desc: string };
    setNewJobData: React.Dispatch<React.SetStateAction<{ code: string; desc: string }>>;
    onCreateJob: () => void;
}

export const CreateJobCodeForm: React.FC<CreateJobCodeFormProps> = ({ newJobData, setNewJobData, onCreateJob }) => {
    return (
        <>
            <label><strong>TẠO JOBCODE MỚI</strong></label>
            <div style={{display:'flex', flexDirection: 'column', gap:'10px', marginBottom:'15px'}}>
                <input 
                    className="admin-input" 
                    placeholder="Mã Job code (VD: KT2004)" 
                    value={newJobData.code} 
                    onChange={e => setNewJobData({...newJobData, code: e.target.value})} 
                    style={{padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px'}}
                />
                <input 
                    className="admin-input" 
                    placeholder="Mô tả jobcode" 
                    value={newJobData.desc} 
                    onChange={e => setNewJobData({...newJobData, desc: e.target.value})} 
                    style={{padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px'}}
                />
            </div>
            <button className="btn-action" onClick={onCreateJob} style={{marginBottom:'15px', padding: '10px 20px', fontSize: '1rem'}}>
                + Tạo Job Mới
            </button>
        </>
    );
};