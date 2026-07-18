import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { declarationService } from '../../services/declaration.service';
import { taskService } from '../../services/task.service';
import type { DeclarationConfig } from '../../types/declaration.types';
import type { Task } from '../../types/task.types';
import { TaskForm } from './TaskForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const toDateInputValue = (value: string) => value.slice(0, 10);
const formatTime24 = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  });

export const OldDeclarationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<DeclarationConfig | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const isOpenDate = config?.mode === 'OPEN_DATE';
  const fixedDate = config?.specificDate ? toDateInputValue(config.specificDate) : '';
  const activeDate = isOpenDate ? fixedDate : selectedDate;

  const loadTasks = async (dateValue: string) => {
    if (!user || !dateValue) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await taskService.getByDate(dateValue, user.id);
      setTasks(data || []);
    } catch (error) {
      setTasks([]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      const data = await declarationService.getCurrent();
      setConfig(data);

      if (data.mode === 'OPEN_DATE' && data.specificDate) {
        const dateValue = toDateInputValue(data.specificDate);
        setSelectedDate(dateValue);
        await loadTasks(dateValue);
      } else if (data.mode === 'OPEN_ALL') {
        const today = new Date().toISOString().slice(0, 10);
        setSelectedDate(today);
        await loadTasks(today);
      }
    };

    fetchConfig().catch((error) => {
      console.error(error);
      setConfig(null);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !config) return;

    if (config.mode === 'OPEN_ALL' && selectedDate) {
      loadTasks(selectedDate);
    }
  }, [selectedDate, config, isOpen]);

  if (!isOpen) return null;

  const handleEditSaved = async () => {
    if (activeDate) {
      await loadTasks(activeDate);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 style={{ color: '#b22222', marginTop: 0 }}>Chỉnh sửa khai báo cũ</h3>

        {!config && <div>Đang tải cấu hình...</div>}

        {config?.mode === 'LOCKED' && (
          <div style={{ padding: '12px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px' }}>
            Khai báo cũ đang bị khóa.
          </div>
        )}

        {config?.mode === 'OPEN_ALL' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Chọn ngày cần chỉnh sửa</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
              className="btn-add"
              style={{ marginLeft: '10px', padding: '8px 14px' }}
              onClick={() => loadTasks(selectedDate)}
              disabled={!selectedDate || isLoading}
            >
              Xem khai báo
            </button>
          </div>
        )}

        {config?.mode === 'OPEN_DATE' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Ngày được mở</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="date"
                value={fixedDate}
                disabled
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', color: '#555' }}
              />
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>
              Chế độ này chỉ mở đúng một ngày duy nhất để chỉnh sửa.
            </div>
          </div>
        )}

        {config && config.mode !== 'LOCKED' && activeDate && (
          <>
            <div style={{ marginBottom: '10px', color: '#555' }}>
              Danh sách khai báo ngày <strong>{activeDate}</strong>
            </div>

            <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
              {isLoading ? (
                <div style={{ padding: '16px' }}>Đang tải...</div>
              ) : tasks.length === 0 ? (
                <div style={{ padding: '16px' }}>Chưa có job nào trong ngày này.</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.task_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f1f1'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{task.job_code}</div>
                      <div style={{ color: '#555', fontSize: '0.92rem' }}>{task.task_description}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        {formatTime24(task.start_time)} - {formatTime24(task.end_time)}
                      </div>
                    </div>
                    <button
                      className="btn-action"
                      style={{ background: '#0069d9' }}
                      onClick={() => setEditTask(task)}
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div style={{ textAlign: 'right', marginTop: '15px' }}>
          <button onClick={onClose} style={{ padding: '8px 15px', border: 'none', background: '#eee', borderRadius: '4px', cursor: 'pointer' }}>
            Đóng
          </button>
        </div>
      </div>

      {editTask && (
        <TaskForm
          isOpen={!!editTask}
          onClose={() => setEditTask(null)}
          editTask={editTask}
          date={new Date(editTask.date)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};
