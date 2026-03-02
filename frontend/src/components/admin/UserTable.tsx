//frontend/src/components/admin/UserTable.tsx
// this file is used to display the list of users in the admin panel, 
// with options to edit or delete users based on the current user's role.
//  It also shows the department names for each user in a clear format.
import React from 'react';

interface UserTableProps {
    users: any[];
    currentUser: any;
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, currentUser, onEdit, onDelete }) => {
    
    // function to display department names 
    // showing each department on a new line with a bullet point.
    const getDeptNameDisplay = (u: any) => {
        if (u.departments && Array.isArray(u.departments) && u.departments.length > 0) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {u.departments.map((d: any) => (
                        <div key={d.id} style={{ padding: '2px 0' }}>• {d.name}</div>
                    ))}
                </div>
            );
        }
        return '-';
    };

    if (users.length === 0) {
        return (
            <div style={{padding:'20px', textAlign:'center', color:'#666', background: 'white', borderRadius: '8px', border: '1px solid #eee'}}>
                Không tìm thấy nhân viên nào.
            </div>
        );
    }

    return (
        <div style={{overflowX: 'auto', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr style={{background: '#f8f9fa', borderBottom: '2px solid #eee'}}>
                        <th style={{padding: '12px', textAlign: 'left'}}>Username</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Vai trò</th>
                        <th style={{padding: '12px', textAlign: 'left'}}>Phòng ban</th>
                        {currentUser?.role === 'admin_total' && (
                            <th style={{padding: '12px', textAlign: 'center'}}>Thao tác</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{borderBottom: '1px solid #eee'}}>
                            <td style={{padding: '12px', fontWeight: 'bold', color: '#333'}}>{u.username}</td>
                            <td style={{padding: '12px'}}>
                                <span style={{padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', background: u.role==='admin_total'?'#ffebee':(u.role==='admin_dept'?'#e3f2fd':'#f1f8e9'), color: u.role==='admin_total'?'#c62828':(u.role==='admin_dept'?'#1565c0':'#2e7d32')}}>
                                    {u.role === 'admin_total' ? 'Admin Tổng' : (u.role === 'admin_dept' ? 'QL Phòng' : 'Nhân viên')}
                                </span>
                            </td>
                            <td style={{padding: '12px'}}>{getDeptNameDisplay(u)}</td>
                            
                            {currentUser?.role === 'admin_total' && (
                                <td style={{padding: '12px', textAlign: 'center'}}>
                                    <button onClick={() => onEdit(u)} style={{marginRight:'5px', border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}} title="Sửa">✏️</button>
                                    <button onClick={() => onDelete(u.id)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}} title="Xóa">🗑️</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};