// frontend/src/pages/LoginPage.tsx
// This file is the React component for the Login Page. It handles user login, including form state management,
// API calls to the backend, and displaying messages to the user.

import React, { useEffect, useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import '../styles/auth.css';

export default function LoginPage() {
    const [urlMessage, setUrlMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    //function to extract messages from URL parameters
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get('error');
        const successMsg = params.get('message');

        if (errorMsg) setUrlMessage({ type: 'error', text: decodeURIComponent(errorMsg) });
        if (successMsg) setUrlMessage({ type: 'success', text: decodeURIComponent(successMsg) });
    }, []);

    return (
        <div className="login-container">
            {/* Left Panel: Branding */}
            <div className="left-panel">
                <div className="circle c1"></div>
                <div className="circle c2"></div>
                <h1>TÍN VIỆT TIMESHEET</h1>
            </div>

            {/* Right Panel: Form */}
            <div className="right-panel">
                <LoginForm initialMessage={urlMessage} />
            </div>
        </div>
    );
}