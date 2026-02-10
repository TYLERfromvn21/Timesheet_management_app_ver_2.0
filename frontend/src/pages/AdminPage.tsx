// frontend/src/pages/AdminPage.tsx
// This file is a React component that implements the Admin Page for user account creation.
// and includes logic for handling different user roles and form submissions.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserManagement } from '../components/admin/UserManagement';
import { DepartmentManagement } from '../components/admin/DepartmentManagement'; 
import '../styles/dashboard.css'; 

export default function AdminPage() {
    //function body
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'users' | 'depts'>('users');

    return (
        <div style={{background: '#f5f7fa', minHeight: '100vh'}}>
            {/* Header */}
            <div style={{background: 'white', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h2 style={{margin: 0, color: '#b22222'}}>QUẢN TRỊ HỆ THỐNG</h2>
                <button onClick={() => navigate('/dashboard')} style={{padding: '8px 15px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer'}}>
                    ← Về Dashboard
                </button>
            </div>

            {/* Content */}
            <div style={{maxWidth: '1200px', margin: '30px auto', padding: '0 20px'}}>
                {/* Tabs */}
                <div style={{marginBottom: '20px', borderBottom: '1px solid #ddd'}}>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '10px 20px', marginRight: '10px', cursor: 'pointer',
                            border: 'none', background: 'transparent',
                            borderBottom: activeTab === 'users' ? '3px solid #b22222' : 'none',
                            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
                            color: activeTab === 'users' ? '#b22222' : '#666'
                        }}
                    >
                        Quản lý Nhân sự
                    </button>
                </div>

                {activeTab === 'users' && <UserManagement />}
            </div>
        </div>
    );
}