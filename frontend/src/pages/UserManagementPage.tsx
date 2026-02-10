// frontend/src/pages/UserManagementPage.tsx
// this file defines the UserManagementPage component which renders the 
// UserManagement component for admin users to manage user accounts. 
// It applies some basic styling for layout and background.
import React from 'react';
import { UserManagement } from '../components/admin/UserManagement';

export default function UserManagementPage() {
    return (
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
            <UserManagement />
        </div>
    );
}