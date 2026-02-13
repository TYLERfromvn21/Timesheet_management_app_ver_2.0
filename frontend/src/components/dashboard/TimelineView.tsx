// frontend/src/components/dashboard/TimelineView.tsx
// this file defines a TimelineView component to visually represent tasks on a timeline from 6 AM to 10 PM.

import React, { useMemo } from 'react';
import '../../styles/dashboard.css'; 
import type { Task } from '../../types/task.types';

// Props for TimelineView component
interface Props {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TimelineView: React.FC<Props> = React.memo(({ tasks, onTaskClick }) => {
    
    // function to render time slots from 6 AM to 10 PM
    const renderTimeSlots = () => {
        const slots = []; 
        for (let i = 6; i <= 22; i++) {
            slots.push(
                <div key={i} className="time-slot">
                    {/* FIX CONTRAST: Thêm style color #333 (Đen xám) và đậm để dễ đọc hơn */}
                    <span className="time-label" style={{ color: '#222', fontWeight: '600' }}>
                        {i}:00
                    </span>
                </div>
            );
        }
        return slots;
    };

    // calculate task positions and render them on the timeline
    const taskElements = useMemo(() => {
        return tasks.map(t => {
            if (!t.start_time || !t.end_time) return null;
            const s = new Date(t.start_time);
            const e = new Date(t.end_time);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

            const startHour = s.getHours();
            const startPos = (startHour - 6) + s.getMinutes() / 60;
            const duration = (e.getTime() - s.getTime()) / 3600000;

            // Format time as HH:MM
            const formatTime = (date: Date) => {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
            };
            const timeRangeText = `${formatTime(s)} - ${formatTime(e)}`;

            if (startPos + duration < 0) return null; 

            const displayTop = startPos < 0 ? 0 : startPos * 50;
            const realDuration = startPos < 0 ? duration + startPos : duration;
            const displayHeight = realDuration * 50;

            if (displayHeight <= 0) return null;

            return (
                <div key={t.id} 
                    onClick={() => onTaskClick(t)}
                    role="button" 
                    tabIndex={0} 
                    onKeyDown={(e) => e.key === 'Enter' && onTaskClick(t)}
                    aria-label={`Công việc ${t.job_code} từ ${timeRangeText}: ${t.task_description}`}
                    
                    style={{
                        position: 'absolute', 
                        left: '60px', right: '10px', 
                        top: `${displayTop}px`, 
                        height: `${displayHeight}px`, 
                        background: '#ffebeb', 
                        borderLeft: '4px solid #b22222', 
                        padding: '2px 8px', fontSize: '11px', cursor: 'pointer', 
                        borderRadius: '4px', overflow: 'hidden', zIndex: 10,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        color: '#8b0000' 
                    }}
                    title={`${t.job_code} (${timeRangeText})`} 
                >
                    <div style={{fontWeight:'bold', color:'#8b0000'}}>
                        {t.job_code || 'No Code'} <span style={{color:'#222', fontWeight:'normal'}}>({timeRangeText})</span>
                    </div>
                    <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#222'}}>
                        {t.task_description}
                    </div>
                </div>
            );
        });
    }, [tasks]);

    return (
        <div className="task-list" style={{ position: 'relative' }}>
            {renderTimeSlots()}
            {taskElements}
        </div>
    );
});