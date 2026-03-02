// frontend/src/components/timesheet/JobSelectionTable.tsx
// this file is used in the timesheet form to display a list of job codes for 
// the selected department, allowing the user to select one for their timesheet entry.
import React from 'react';

interface JobSelectionTableProps {
    jobCodes: any[];
    selectedJobCode: string;
    selectedDepartment: string;
    onSelectJob: (job: any) => void;
}

export const JobSelectionTable: React.FC<JobSelectionTableProps> = ({ 
    jobCodes, 
    selectedJobCode, 
    selectedDepartment, 
    onSelectJob 
}) => {
    return (
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
                        <tr>
                            <td colSpan={3} style={{textAlign:'center', padding:'20px', color:'#888'}}>
                                {selectedDepartment ? "Không có Job nào trong phòng này" : "Vui lòng chọn phòng ban"}
                            </td>
                        </tr>
                    )}
                    {jobCodes.map(j => {
                        const code = j.job_code; 
                        const desc = j.task_description;
                        const isSelected = selectedJobCode === code;
                        
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
                                        onClick={() => onSelectJob(j)} 
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
    );
};