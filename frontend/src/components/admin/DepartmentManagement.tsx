// frontend/src/components/admin/DepartmentManagement.tsx
// this file provides a modal interface for managing departments in the admin panel
// and allows adding, updating, and deleting departments.

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { departmentService } from '../../services/department.service';

interface Props {
    onClose: () => void;
}

export const DepartmentManagement: React.FC<Props> = ({ onClose }) => {
    const { departments, fetchDepartments } = useUserStore();
    const [newDeptName, setNewDeptName] = useState('');

    // fetch departments on mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    //functions to handle add
    const handleAddDept = async () => {
        if(!newDeptName) return; 
        await departmentService.create(newDeptName);
        setNewDeptName(''); 
        fetchDepartments();
    };

    //functions to handle update 
    const handleUpdateDept = async (id: string, newName: string) => {
        if(!confirm("Cập nhật tên?")) return; 
        await departmentService.update(id, newName); 
        fetchDepartments();
    };

    //functions to handle delete
    const handleDeleteDept = async (id: string) => {
        if(!confirm("Xóa phòng?")) return; 
        try {
            await departmentService.delete(id);
            fetchDepartments();
        } catch(e) { alert("Không thể xóa (có thể đang có nhân viên)"); }
    };

    // render component
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{color: '#b22222', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>QUẢN LÝ PHÒNG BAN</h3>
                
                <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                    <input 
                        placeholder="Tên phòng ban..." 
                        value={newDeptName} 
                        onChange={e => setNewDeptName(e.target.value)}
                        style={{flex:1, padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} 
                        aria-label="Nhập tên phòng ban mới"
                    />
                    <button onClick={handleAddDept} style={{padding:'8px 15px', background:'#e65100', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Thêm Mới</button>
                </div>
                
                <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px'}}>
                    {departments.map(d => (
                        <div key={d.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee'}}>
                            <div style={{flex:1, display: 'flex', alignItems: 'center'}}>
                                <input 
                                    defaultValue={d.name} 
                                    onBlur={(e) => handleUpdateDept(d.id, e.target.value)} 
                                    style={{border: '1px solid transparent', padding: '4px', width: '60%', fontWeight: 500, color:'#333'}} 
                                    aria-label={`Sửa tên phòng ${d.name}`}
                                />
                                <span style={{fontSize: '0.85rem', color: '#444', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px', fontWeight: 'bold'}}>
                                    {d.code}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleDeleteDept(d.id)} 
                                style={{color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize:'0.8rem'}}
                                aria-label={`Xóa phòng ${d.name}`}
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{textAlign:'right', marginTop:'15px'}}>
                    <button onClick={onClose} style={{padding:'8px 20px', background:'#eee', border:'none', borderRadius:'4px', cursor:'pointer'}}>Đóng</button>
                </div>
            </div>
        </div>
    );
};