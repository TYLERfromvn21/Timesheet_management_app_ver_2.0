// frontend/src/components/reports/ReportGenerator.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { reportService } from '../../services/report.service';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { jobCodeService } from '../../services/jobCode.service';
import { JobSelectionTable } from '../timesheet/JobSelectionTable';
import type { JobCode } from '../../types/task.types';

interface Props {
  type: 'USER' | 'JOB';
  onClose: () => void;
}

export const ReportGenerator: React.FC<Props> = ({ type, onClose }) => {
  const { user } = useAuthStore();
  const { users, fetchUsers, fetchDepartments, departments } = useUserStore();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [userId, setUserId] = useState('');
  const [jobCode, setJobCode] = useState('');
  const [jobCodes, setJobCodes] = useState<JobCode[]>([]);
  const [jobReportStep, setJobReportStep] = useState<'MENU' | 'DETAIL_SELECT'>('MENU');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');

  const isTotalAdmin = user?.role === 'admin_total';
  const managedDeptIds = useMemo(() => user?.departmentIds ?? [], [user?.departmentIds]);
  const visibleUsers = isTotalAdmin
    ? users
    : users.filter(u => u.departments?.some(dept => managedDeptIds.includes(dept.id)));

  // Map dept id -> name for display
  const deptMap = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [departments]);

  // unique departments present in jobCodes (with names)
  const uniqueDepartments = useMemo(() => {
    const ids = Array.from(new Set(jobCodes.map(j => j.department)));
    return ids.map(id => ({ id, name: deptMap[id] || id })).sort((a,b)=>a.name.localeCompare(b.name));
  }, [jobCodes, deptMap]);

  // filtered job codes by selected department and search query
  const filteredJobCodes = useMemo(() => {
    const base = selectedDepartmentFilter
      ? jobCodes.filter(j => j.department === selectedDepartmentFilter)
      : jobCodes.slice();

    if (!jobSearchQuery.trim()) return base;

    const q = jobSearchQuery.trim().toLowerCase();
    return base.filter(j =>
      j.job_code.toLowerCase().includes(q) ||
      j.task_description.toLowerCase().includes(q)
    );
  }, [jobCodes, selectedDepartmentFilter, jobSearchQuery]);

  useEffect(() => {
    if (jobReportStep !== 'DETAIL_SELECT') return;
    if (filteredJobCodes.length === 0) {
      setJobCode('');
      return;
    }
    if (!filteredJobCodes.some(j => j.job_code === jobCode)) {
      setJobCode(filteredJobCodes[0].job_code);
    }
  }, [filteredJobCodes, jobCode, jobReportStep]);

  useEffect(() => {
    if (type === 'USER') {
      fetchUsers();
      return;
    }

    if (type === 'JOB') {
      const loadJobCodes = async () => {
        await fetchDepartments();
        const allDepartments = useUserStore.getState().departments;
        const deptIds = isTotalAdmin ? allDepartments.map(d => d.id) : managedDeptIds;
        const uniqueDeptIds = Array.from(new Set(deptIds));
        const results = await Promise.all(uniqueDeptIds.map(id => jobCodeService.getByDept(id)));
        const flattened = results
          .flat()
          .filter((job, idx, arr) => arr.findIndex(i => i.id === job.id) === idx)
          .sort((a,b) => a.job_code.localeCompare(b.job_code));

        setJobCodes(flattened);
        setJobCode(prev => (prev && flattened.some(j => j.job_code === prev)) ? prev : (flattened[0]?.job_code || ''));

        if (flattened.length > 0 && !selectedDepartmentFilter) {
          setSelectedDepartmentFilter(flattened[0].department || '');
        }
      };

      loadJobCodes().catch(e => { console.error(e); setJobCodes([]); });
    }
  }, [type, fetchUsers, fetchDepartments, isTotalAdmin, managedDeptIds]);

  const openJobDetailSelection = () => {
    setJobReportStep('DETAIL_SELECT');
    if (filteredJobCodes.length > 0 && !jobCode) setJobCode(filteredJobCodes[0].job_code);
  };

  const handleDownloadReport = async (jobCodeMode: 'SUMMARY' | 'DETAIL') => {
    if (type === 'USER' && !userId) return alert('Vui lòng chọn nhân viên!');
    if (type === 'JOB' && jobCodeMode === 'DETAIL' && !jobCode) return alert('Vui lòng chọn jobcode cần xuất!');

    try {
      let response: any;
      let filename = '';

      if (type === 'USER') {
        response = await reportService.downloadUserReport(userId, month, year);
        const selectedUser = visibleUsers.find(u => u.id === userId);
        const username = selectedUser ? selectedUser.username : 'Unknown';
        filename = `BAOCAO_USER_${username}_${month}_${year}.xlsx`;
      } else {
        if (jobCodeMode === 'SUMMARY') {
          response = await reportService.downloadJobReport(month, year);
          filename = `BAOCAO_JOBCODE_THANG_${month}_NAM_${year}.xlsx`;
        } else {
          const effectiveJobCode = jobCode || filteredJobCodes[0]?.job_code || '';
          if (!effectiveJobCode) return alert('Vui lòng chọn jobcode cần xuất!');
          response = await reportService.downloadJobReport(month, year, effectiveJobCode);
          filename = `BAOCAO_CHITIET_JOBCODE_${effectiveJobCode}_${month}_${year}.xlsx`;
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (e) {
      console.error(e);
      alert('Lỗi tải báo cáo (Kiểm tra lại Backend hoặc Dữ liệu)');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{width: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
        <h3 style={{color:'#b22222', marginTop:0, borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
          Xuất Báo Cáo {type === 'USER' ? 'Nhân viên' : 'Job'}
        </h3>

        <div className="form-group" style={{display:'flex', gap:'15px'}}>
          <div style={{flex:1}}>
            <label>Tháng</label>
            <input
              type="number" min="1" max="12"
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              style={{width:'100%', padding:'5px', border: '1px solid #ccc', borderRadius:'4px'}}
            />
          </div>
          <div style={{flex:1}}>
            <label>Năm</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              style={{width:'100%', padding:'5px', border: '1px solid #ccc', borderRadius:'4px'}}
            />
          </div>
        </div>

        {type === 'USER' && (
          <div className="form-group">
            <label>Chọn Nhân viên</label>
            <select
              style={{width:'100%', height:'150px', padding: '5px', border: '1px solid #ccc', borderRadius:'4px'}}
              multiple={false}
              size={5}
              value={userId}
              onChange={e => setUserId(e.target.value)}
            >
              {visibleUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role === 'admin_total' ? 'Admin' : 'NV'})
                </option>
              ))}
            </select>
            {!isTotalAdmin && visibleUsers.length === 0 && (
              <div style={{marginTop:'8px', color:'#888', fontSize:'0.9rem'}}>
                Không có nhân viên nào thuộc phòng ban bạn quản lý.
              </div>
            )}
          </div>
        )}

        {type === 'JOB' && (
          <div className="form-group">
            {jobReportStep === 'MENU' ? (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button
                  type="button"
                  onClick={() => handleDownloadReport('SUMMARY')}
                  style={{padding:'10px 14px', background:'#0069d9', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
                >
                  Xuất toàn bộ jobcode
                </button>
                <button
                  type="button"
                  onClick={openJobDetailSelection}
                  style={{padding:'10px 14px', background:'#2ecc71', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
                >
                  Xuất 1 jobcode
                </button>
              </div>
            ) : (
              <div style={{display:'flex', gap:'16px', alignItems: 'flex-start'}}>
                {/* LEFT: Large job code table */}
                <div style={{flex: 2, minWidth: 0}}>
                  <div style={{fontWeight: 600, color: '#555', fontSize: '1.05rem', marginBottom: '8px'}}>
                    Danh sách Jobcode
                  </div>
                  <div style={{height: '76vh', overflow: 'hidden', borderRadius: '6px', border: '1px solid #ddd'}}>
                    <JobSelectionTable
                      jobCodes={filteredJobCodes}
                      selectedJobCode={jobCode}
                      selectedDepartment={selectedDepartmentFilter}
                      onSelectJob={(job) => setJobCode(job.job_code)}
                    />
                  </div>
                </div>

                {/* RIGHT: Filters and actions */}
                <div style={{flex: 1, maxWidth: '360px'}}>
                  <div style={{marginBottom: '12px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333'}}>Phòng ban</label>
                    <select
                      value={selectedDepartmentFilter}
                      onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                      style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius:'4px', fontSize: '0.95rem', fontWeight: 500}}
                    >
                      {uniqueDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{marginBottom: '12px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333'}}>Tìm kiếm Jobcode</label>
                    <input
                      type="text"
                      placeholder="Nhập mã hoặc mô tả..."
                      value={jobSearchQuery}
                      onChange={(e) => setJobSearchQuery(e.target.value)}
                      style={{width:'100%', padding:'10px', border: '1px solid #ccc', borderRadius:'4px'}}
                    />
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'8px'}}>
                    <button
                      type="button"
                      onClick={() => handleDownloadReport('DETAIL')}
                      disabled={!jobCode}
                      style={{padding:'10px', background: jobCode ? '#2ecc71' : '#9dd7b2', color:'white', border:'none', borderRadius:'4px', cursor: jobCode ? 'pointer' : 'not-allowed', fontWeight:'bold'}}
                    >
                      Xuất báo cáo 1 jobcode
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobReportStep('MENU')}
                      style={{padding:'10px', border:'1px solid #ccc', background:'white', borderRadius:'4px', cursor:'pointer'}}
                    >
                      Quay lại
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{textAlign:'right', marginTop:'20px', display:'flex', gap:'8px', justifyContent:'flex-end', flexWrap:'wrap'}}>
          <button
            onClick={onClose}
            style={{padding:'8px 15px', border:'1px solid #ccc', background:'white', borderRadius:'4px', cursor:'pointer', marginRight:'5px'}}
          >
            Đóng
          </button>
          {type === 'USER' && (
            <button
              onClick={() => handleDownloadReport('SUMMARY')}
              style={{padding:'8px 15px', background:'#2ecc71', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
            >
              ⬇ Tải Excel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
