import React, { useEffect, useState } from 'react';
import { declarationService } from '../../services/declaration.service';
import type { DeclarationConfig, DeclarationMode } from '../../types/declaration.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: DeclarationConfig) => void;
}

export const DeclarationManagementModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [mode, setMode] = useState<DeclarationMode>('LOCKED');
  const [specificDate, setSpecificDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoading(true);
      try {
        const config = await declarationService.getCurrent();
        setMode(config.mode);
        setSpecificDate(config.specificDate ? config.specificDate.slice(0, 10) : '');
      } finally {
        setLoading(false);
      }
    };

    load().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = await declarationService.save(mode, mode === 'OPEN_DATE' ? specificDate : null);
      if (onSaved) onSaved(config);
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 style={{ color: '#b22222', marginTop: 0 }}>Quản lý khai báo</h3>

        {loading ? (
          <div>Đang tải cấu hình...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '15px' }}>
              <label style={{ padding: '12px', border: mode === 'LOCKED' ? '2px solid #b22222' : '1px solid #ddd', borderRadius: '8px' }}>
                <input type="radio" checked={mode === 'LOCKED'} onChange={() => setMode('LOCKED')} style={{ marginRight: '8px' }} />
                Đóng khai báo cũ
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Mặc định, không cho sửa hoặc khai báo ngày quá khứ.</div>
              </label>

              <label style={{ padding: '12px', border: mode === 'OPEN_ALL' ? '2px solid #218838' : '1px solid #ddd', borderRadius: '8px' }}>
                <input type="radio" checked={mode === 'OPEN_ALL'} onChange={() => setMode('OPEN_ALL')} style={{ marginRight: '8px' }} />
                Mở khai báo cũ
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Cho phép mở lại tất cả các ngày quá khứ.</div>
              </label>

              <label style={{ padding: '12px', border: mode === 'OPEN_DATE' ? '2px solid #0069d9' : '1px solid #ddd', borderRadius: '8px' }}>
                <input type="radio" checked={mode === 'OPEN_DATE'} onChange={() => setMode('OPEN_DATE')} style={{ marginRight: '8px' }} />
                Mở khai báo ngày cũ
                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Chỉ mở một ngày cụ thể để chỉnh sửa hoặc khai báo lại.</div>
              </label>
            </div>

            {mode === 'OPEN_DATE' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Chọn ngày mở</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px', border: 'none', background: '#eee', borderRadius: '4px', cursor: 'pointer' }}>
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 15px', border: 'none', background: '#b22222', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
              >
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
