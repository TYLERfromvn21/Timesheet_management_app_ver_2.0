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

    // Fetch departments on component mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    //functions to handle add, update, delete
    const handleAddDept = async () => {
        if(!newDeptName) return; 
        await departmentService.create(newDeptName);
        setNewDeptName(''); 
        fetchDepartments();
    };

    //function to handle update
    const handleUpdateDept = async (id: string, newName: string) => {
        if(!confirm("Cập nhật tên?")) return; 
        await departmentService.update(id, newName); 
        fetchDepartments();
    };

    //function to handle delete
    const handleDeleteDept = async (id: string) => {
        if(!confirm("Xóa phòng?")) return; 
        try {
            await departmentService.delete(id);
            fetchDepartments();
        } catch (e) { alert("Không xóa được (có thể còn nhân viên)"); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '600px'}}>
                <h2 style={{color: '#f39c12', marginTop: 0, display:'flex', justifyContent:'space-between'}}>
                    Quản lý Phòng Ban 
                    <span onClick={onClose} style={{cursor: 'pointer', color: '#999'}}>✖</span>
                </h2>
                <div style={{background:'#fff3e0', padding:'15px', borderRadius:'6px', marginBottom:'15px', display:'flex', gap:'10px', border:'1px solid #ffe0b2'}}>
                    <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Nhập tên phòng ban mới..." style={{flex:1, padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                    <button onClick={handleAddDept} style={{padding:'8px 15px', background:'#e65100', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Thêm Mới</button>
                </div>
                <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px'}}>
                    {departments.map(d => (
                        <div key={d.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee'}}>
                            <div style={{flex:1, display: 'flex', alignItems: 'center'}}>
                                <input defaultValue={d.name} onBlur={(e) => handleUpdateDept(d.id, e.target.value)} style={{border: '1px solid transparent', padding: '4px', width: '60%', fontWeight: 500}} />
                                <span style={{fontSize: '0.85rem', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px'}}>{d.code}</span>
                            </div>
                            <button onClick={() => handleDeleteDept(d.id)} style={{color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>🗑 Xóa</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};