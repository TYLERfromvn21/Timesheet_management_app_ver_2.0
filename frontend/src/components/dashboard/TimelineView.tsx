// frontend/src/components/dashboard/TimelineView.tsx
// this file defines a TimelineView component to visually represent tasks on a timeline from 6 AM to 10 PM.

import React from 'react';
import '../../styles/dashboard.css'; 
interface Task {
    id: string;
    job_code: string;
    task_description: string;
    start_time: string;
    end_time: string;
}

interface Props {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TimelineView: React.FC<Props> = ({ tasks, onTaskClick }) => {
    
    //function to render time slots from 6 AM to 10 PM
    const renderTimeSlots = () => {
        const slots = []; 
        for (let i = 6; i <= 22; i++) {
            slots.push(<div key={i} className="time-slot"><span className="time-label">{i}:00</span></div>);
        }
        return slots;
    };

        //function to render tasks on the timeline
    const renderTasksOnTimeline = () => {
        return tasks.map(t => {
            if (!t.start_time || !t.end_time) return null;
            const s = new Date(t.start_time);
            const e = new Date(t.end_time);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

            const startHour = s.getHours();
            const startPos = (startHour - 6) + s.getMinutes() / 60;
            const duration = (e.getTime() - s.getTime()) / 3600000;

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

            // JSX for each task block
            return (
                <div key={t.id} onClick={() => onTaskClick(t)} 
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
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                    }}>
                    <div style={{fontWeight:'bold', color:'#b22222'}}>
                        {t.job_code || 'No Code'} <span style={{color:'#555', fontWeight:'normal'}}>({timeRangeText})</span>
                    </div>
                    <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                        {t.task_description}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="task-list" style={{ position: 'relative' }}>
            {renderTimeSlots()}
            {renderTasksOnTimeline()}
        </div>
    );
};