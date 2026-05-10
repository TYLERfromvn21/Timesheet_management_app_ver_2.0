// frontend/src/components/admin/JobCodeManagementModal.tsx
// this file contains the Job Code Management Modal component for admin users
// it includes search functionality, edit and delete operations for job codes
import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { jobCodeService } from '../../services/jobCode.service';

interface JobCodeManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JobCodeManagementModal: React.FC<JobCodeManagementModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const { departments, fetchDepartments } = useUserStore();
    const { jobCodes, fetchJobCodes } = useTaskStore();
    
    const [selectedDept, setSelectedDept] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editJob, setEditJob] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ job_code: '', task_description: '' });

    const isTotalAdmin = user?.role === 'admin_total';
    const myDeptIds = user?.departmentIds || [];

    const manageableDepts = isTotalAdmin 
        ? departments 
        : departments.filter(d => myDeptIds.includes(d.id));

    // function to initialize departments and default department selection
    useEffect(() => {
        fetchDepartments();
        if (!isTotalAdmin && myDeptIds.length === 1 && !selectedDept) {
            setSelectedDept(myDeptIds[0]);
        }
    }, [user, myDeptIds]);

    // function to fetch job codes when selected department changes
    useEffect(() => {
        if (selectedDept) {
            fetchJobCodes(selectedDept);
        } else if (!isTotalAdmin && myDeptIds.length > 0) {
            fetchJobCodes(myDeptIds.join(','));
        }
    }, [selectedDept, isTotalAdmin, myDeptIds.length]);

    // function to filter job codes based on search term (supports Vietnamese and English)
    const filteredJobCodes = jobCodes.filter(job => 
        job.job_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.task_description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // function to handle opening edit form for a job code
    const handleEditClick = (job: any) => {
        setEditJob(job);
        setEditFormData({ job_code: job.job_code, task_description: job.task_description });
    };

    // function to handle saving edited job code
    const handleSaveEdit = async () => {
        if (!editJob) return;
        if (!editFormData.job_code || !editFormData.task_description) {
            return alert('Vui lòng điền đầy đủ thông tin!');
        }

        try {
            await jobCodeService.update(editJob.id, editFormData);
            const targetDept = selectedDept || (myDeptIds.length === 1 ? myDeptIds[0] : '');
            if (targetDept) fetchJobCodes(targetDept);
            setEditJob(null);
            setEditFormData({ job_code: '', task_description: '' });
            alert('Cập nhật job code thành công!');
        } catch (e) {
            alert('Lỗi cập nhật job code (Có thể mã trùng)');
        }
    };

    // function to handle deleting a job code
    const handleDeleteJob = async (id: string) => {
        if (!confirm('Xóa job này?')) return;
        try {
            await jobCodeService.delete(id);
            const targetDept = selectedDept || (myDeptIds.length === 1 ? myDeptIds[0] : '');
            if (targetDept) fetchJobCodes(targetDept);
            else if (myDeptIds.length > 0) fetchJobCodes(myDeptIds.join(','));
        } catch (e) {
            alert('Không thể xóa job đang dùng');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#b22222' }}>Quản Lý Job Code</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                {(isTotalAdmin || manageableDepts.length > 1) && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                            Chọn Phòng Ban:
                        </label>
                        <select 
                            className="admin-input" 
                            value={selectedDept} 
                            onChange={e => setSelectedDept(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '1rem',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">-- {isTotalAdmin ? 'Chọn phòng' : 'Tất cả phòng của tôi'} --</option>
                            {manageableDepts.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                        Tìm kiếm Job Code:
                    </label>
                    <input 
                        type="text"
                        placeholder="Nhập mã job hoặc mô tả để tìm kiếm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '1rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {editJob ? (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#b22222' }}>Chỉnh Sửa Job Code</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mã Job Code:</label>
                                <input 
                                    className="admin-input"
                                    value={editFormData.job_code}
                                    onChange={e => setEditFormData({ ...editFormData, job_code: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mô Tả:</label>
                                <input 
                                    className="admin-input"
                                    value={editFormData.task_description}
                                    onChange={e => setEditFormData({ ...editFormData, task_description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button 
                                    onClick={handleSaveEdit}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '1rem',
                                        backgroundColor: '#218838',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Lưu Thay Đổi
                                </button>
                                <button 
                                    onClick={() => {
                                        setEditJob(null);
                                        setEditFormData({ job_code: '', task_description: '' });
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '1rem',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>DANH SÁCH JOB CODE ({filteredJobCodes.length})</strong>
                        </div>
                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid #eee',
                            borderRadius: '4px',
                            backgroundColor: '#fff'
                        }}>
                            {filteredJobCodes.length === 0 ? (
                                <p style={{ color: '#555', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                                    {searchTerm ? 'Không tìm thấy job code nào.' : 'Chưa có dữ liệu.'}
                                </p>
                            ) : (
                                filteredJobCodes.map(job => (
                                    <div 
                                        key={job.id} 
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: '#fff'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', color: '#b22222', marginBottom: '4px' }}>
                                                {job.job_code}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#333' }}>
                                                {job.task_description}
                                            </div>
                                        </div>
                                        {(isTotalAdmin || user?.role === 'admin_dept') && (
                                            <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                                                <button 
                                                    onClick={() => handleEditClick(job)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.9rem',
                                                        backgroundColor: '#0069d9',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.9rem',
                                                        backgroundColor: '#d32f2f',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
