// frontend/src/components/reports/ReportGenerator.tsx
// this file is responsible for generating and downloading user and job reports in Excel format.
import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/report.service';
import { useUserStore } from '../../store/userStore';

interface Props {
    type: 'USER' | 'JOB';
    onClose: () => void;
}

export const ReportGenerator: React.FC<Props> = ({ type, onClose }) => {
    const { users, fetchUsers } = useUserStore();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [userId, setUserId] = useState('');

    // function to fetch users if the report type is USER
    useEffect(() => {
        if (type === 'USER') fetchUsers();
    }, [type]);

    // function to handle report download
    const handleDownloadReport = async () => {
        if (type === 'USER' && !userId) return alert("Vui lòng chọn nhân viên!");
        
        try {
            let response;
            let filename = '';

            //format filename based on report type
            if (type === 'USER') {
                response = await reportService.downloadUserReport(userId, month, year);
                const selectedUser = users.find(u => u.id === userId);
                const username = selectedUser ? selectedUser.username : 'Unknown';
                
                filename = `BAOCAO_USER_${username}_${month}_${year}.xlsx`; 
            
            } else {
                response = await reportService.downloadJobReport(month, year);
                
                filename = `BAOCAO_JOBCODE_THANG_${month}_NAM_${year}.xlsx`;
            }

            // Logic creating a download link and triggering the download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename); 
            document.body.appendChild(link);
            link.click();
            
            // cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
            
            onClose();
        } catch(e) { 
            console.error(e);
            alert("Lỗi tải báo cáo (Kiểm tra lại Backend hoặc Dữ liệu)"); 
        }
    };

    // JSX for the report generator modal
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '400px'}}>
                <h3 style={{color:'#b22222', marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                    Xuất Báo Cáo {type === 'USER' ? 'Nhân viên' : 'Job'}
                </h3>
                
                <div className="form-group" style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                        <label>Tháng</label>
                        <input 
                            type="number" min="1" max="12" 
                            value={month} 
                            onChange={e => setMonth(parseInt(e.target.value))} 
                            style={{width:'100%', padding:'5px', border: '1px solid #ccc', borderRadius:'4px'}} 
                        />
                    </div>
                    <div style={{flex:1}}>
                        <label>Năm</label>
                        <input 
                            type="number" 
                            value={year} 
                            onChange={e => setYear(parseInt(e.target.value))} 
                            style={{width:'100%', padding:'5px', border: '1px solid #ccc', borderRadius:'4px'}} 
                        />
                    </div>
                </div>

                {type === 'USER' && (
                    <div className="form-group">
                        <label>Chọn Nhân viên</label>
                        <select 
                            style={{width:'100%', height:'150px', padding: '5px', border: '1px solid #ccc', borderRadius:'4px'}} 
                            multiple={false} 
                            size={5} 
                            value={userId} 
                            onChange={e => setUserId(e.target.value)}
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.username} ({u.role === 'admin_total' ? 'Admin' : 'NV'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{textAlign:'right', marginTop:'20px'}}>
                    <button 
                        onClick={onClose} 
                        style={{padding:'8px 15px', border:'1px solid #ccc', background:'white', borderRadius:'4px', cursor:'pointer', marginRight:'5px'}}
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={handleDownloadReport} 
                        style={{padding:'8px 15px', background:'#2ecc71', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
                    >
                        ⬇ Tải Excel
                    </button>
                </div>
            </div>
        </div>
    );
};