//frontend/src/components/admin/UserTable.tsx
// this file is used to display the list of users in the admin page,
//  with options to edit and delete users for admin_total role. It also shows department names as badges for each user.
import React from 'react';

interface UserTableProps {
    users: any[];
    currentUser: any;
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, currentUser, onEdit, onDelete }) => {
    //function to display department names as badges
    const getDeptNameDisplay = (u: any) => {
        if (u.departments && Array.isArray(u.departments) && u.departments.length > 0) {
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.departments.map((d: any) => (
                        <span key={d.id} style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '3px 8px', borderRadius: '12px', fontSize: '0.85em', color: '#444', whiteSpace: 'nowrap' }}>
                            {d.name}
                        </span>
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
            <table className="responsive-user-table" style={{width: '100%', borderCollapse: 'collapse'}}>
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
                            <td className="td-username" style={{padding: '12px', fontWeight: 'bold', color: '#333'}}>{u.username}</td>
                            <td className="td-role" style={{padding: '12px'}}>
                            <span style={{display: 'inline-block', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', background: u.role==='admin_total'?'#ffebee':(u.role==='admin_dept'?'#e3f2fd':'#f1f8e9'), color: u.role==='admin_total'?'#c62828':(u.role==='admin_dept'?'#1565c0':'#2e7d32')}}>
                              {u.role === 'admin_total' ? 'Admin Tổng' : (u.role === 'admin_dept' ? 'QL Phòng' : 'Nhân viên')}
                             </span>
                            </td>
                            <td className="td-dept" style={{padding: '12px'}}>{getDeptNameDisplay(u)}</td>
                            
                            {currentUser?.role === 'admin_total' && (
                                <td className="td-action" style={{padding: '12px', textAlign: 'center'}}>
                                    <button onClick={() => onEdit(u)} style={{marginRight:'15px', border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}} title="Sửa">✏️</button>
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