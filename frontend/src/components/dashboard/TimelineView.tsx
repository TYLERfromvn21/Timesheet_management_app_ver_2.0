// frontend/src/components/dashboard/TimelineView.tsx
// this file defines a TimelineView component to visually represent tasks on a timeline from 6 AM to 10 PM.

import React, { useMemo } from 'react';
import '../../styles/dashboard.css'; 
import '../../styles/dashboard-mobile.css';
import type { Task } from '../../types/task.types';

// Props for TimelineView component
interface Props {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TimelineView: React.FC<Props> = React.memo(({ tasks, onTaskClick }) => {
    
    // Format time in 24h to keep the dashboard consistent with the input UI.
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Ho_Chi_Minh', 
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // function to render time slots from 06:00 to 22:00
    const renderTimeSlots = () => {
        const slots = []; 
        for (let i = 6; i <= 22; i++) {
            const displayHour = String(i).padStart(2, '0');
            
            slots.push(
                <div key={i} className="time-slot">
                    <span className="time-label" style={{ color: '#222', fontWeight: '600' }}>
                        {displayHour}:00
                    </span>
                </div>
            );
        }
        return slots;
    };

    // [DESKTOP] calculate task positions and render them on the timeline
    const taskElements = useMemo(() => {
        // Sort tasks by start time to handle consecutive short tasks
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        // Track vertical offset for consecutive short tasks
        const layoutState = {
            shortTaskStackOffset: 0,
            lastTaskEnd: 0
        };

        return sortedTasks.map(t => {
            if (!t.start_time || !t.end_time) return null;
            const s = new Date(t.start_time);
            const e = new Date(t.end_time);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

            const startHour = s.getHours();
            const startPos = (startHour - 6) + s.getMinutes() / 60;
            const duration = (e.getTime() - s.getTime()) / 3600000;
            const timeRangeText = `${formatTime(s)} - ${formatTime(e)}`;

            if (startPos + duration < 0) return null; 

            // Check if task is very short (less than 15 minutes)
            const isShortTask = duration < 0.25;
            
            let displayTop, displayHeight;
            
            if (isShortTask) {
                // For short tasks, expand height to show full info and stack consecutive short tasks
                const currentStart = startPos;
                
                // Reset stack offset if there's a gap between tasks (more than 5 minutes)
                if (currentStart > layoutState.lastTaskEnd + 0.083) {
                    layoutState.shortTaskStackOffset = 0;
                }
                
                displayTop = (currentStart * 50) + layoutState.shortTaskStackOffset;
                displayHeight = Math.max(duration * 50, 60); // Minimum 60px height for short tasks
                layoutState.lastTaskEnd = currentStart + duration;
                layoutState.shortTaskStackOffset += displayHeight + 5; // Stack below with 5px gap
            } else {
                // Normal task positioning
                displayTop = startPos < 0 ? 0 : startPos * 50;
                const realDuration = startPos < 0 ? duration + startPos : duration;
                displayHeight = realDuration * 50;
                layoutState.shortTaskStackOffset = 0; // Reset stack offset for normal tasks
                layoutState.lastTaskEnd = startPos + duration;
            }

            if (displayHeight <= 0) return null;

            return (
                <div key={t.id} 
                    onClick={() => onTaskClick(t)}
                    role="button" 
                    tabIndex={0} 
                    onKeyDown={(e) => e.key === 'Enter' && onTaskClick(t)}
                    style={{
                        position: 'absolute', left: '60px', right: '10px', top: `${displayTop}px`, height: `${displayHeight}px`, 
                        background: '#ffebeb', borderLeft: '4px solid #b22222', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', 
                        borderRadius: '4px', overflow: 'visible', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', transition: 'all 0.2s ease', color: '#8b0000' 
                    }}
                    title={`${t.job_code} (${timeRangeText})`} 
                >
                    <div style={{fontWeight:'bold', color:'#8b0000', marginBottom: '2px'}}>
                        {t.job_code || 'No Code'} <span style={{color:'#222', fontWeight:'normal'}}>({timeRangeText})</span>
                    </div>
                    <div style={{whiteSpace:'normal', overflow:'visible', color:'#222', lineHeight: '1.3'}}>
                        {t.task_description}
                    </div>
                </div>
            );
        });
    }, [tasks, onTaskClick]);

    // [MOBILE] Render Agenda List 
    const mobileAgendaElements = useMemo(() => {
        if (tasks.length === 0) {
            return <div className="empty-agenda">Không có công việc nào trong ngày.</div>;
        }

        // Sort tasks by start time
        const sortedTasks = [...tasks].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        return sortedTasks.map(t => {
            if (!t.start_time || !t.end_time) return null;
            const s = new Date(t.start_time);
            const e = new Date(t.end_time);

            return (
                <div key={`mob-${t.id}`} className="agenda-item" onClick={() => onTaskClick(t)}>
                    <div className="agenda-time">
                        <div style={{fontWeight: 'bold', color: '#333'}}>
                            <span className="agenda-time-dot"></span>{formatTime(s)}
                        </div>
                        <div style={{color: '#888', paddingLeft: '14px', fontSize: '0.8rem'}}>{formatTime(e)}</div>
                    </div>
                    <div className="agenda-content">
                        <div className="agenda-title">{t.job_code || 'Chưa có mã Job'}</div>
                        <div className="agenda-desc">{t.task_description}</div>
                    </div>
                </div>
            );
        });
    }, [tasks, onTaskClick]);

    return (
        <>
            <div className="desktop-timeline" style={{ position: 'relative' }}>
                {renderTimeSlots()}
                {taskElements}
            </div>

            <div className="mobile-agenda">
                {mobileAgendaElements}
            </div>
        </>
    );
});
