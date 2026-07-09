// backend/src/services/ReportService.ts
// This file handles report generation: user reports and job reports.
// and it creates Excel files with detailed formatting.
import prisma from '../config/prisma';
import * as ExcelJS from 'exceljs';

type ReportRequester = {
  id: string;
  role: 'admin_total' | 'admin_dept' | 'user';
  departmentIds: string[];
};

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const toVietnamWallTime = (value: Date) => {
  const localOffset = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - localOffset - VIETNAM_OFFSET_MS);
};

const formatAmPm = (value: Date) =>
  value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Ho_Chi_Minh'
  });

const isRequesterAllowedForDept = (requester: ReportRequester | null | undefined, deptId: string) => {
  if (!requester || requester.role === 'admin_total') return true;
  return requester.departmentIds.includes(deptId);
};

const isRequesterAllowedForUser = async (requester: ReportRequester | null | undefined, userId: string) => {
  if (!requester || requester.role === 'admin_total') return true;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      departments: {
        select: { id: true }
      }
    }
  });

  if (!targetUser) throw new Error('User not found');
  return targetUser.departments.some(d => requester.departmentIds.includes(d.id));
};

export const ReportService = {
  
  // ==========================================================================
  // 1. USER REPORT 
  // ==========================================================================
  //function to generate user report
  generateUserReport: async (userId: string, month: number, year: number, requester?: ReportRequester | null) => {
    // 1. take userId, month, year as input
    // output: ExcelJS.Workbook object representing the report
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isAllowed = await isRequesterAllowedForUser(requester, userId);
    if (!isAllowed) throw new Error('FORBIDDEN: You do not have permission to view this user report');

    // 2. calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); 

    // 3. take tasks for the user in that month
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    // 4. take job code mappings
    const allJobs = await prisma.jobCode.findMany();
    const jobMap = new Map();
    allJobs.forEach(j => jobMap.set(`${j.department}_${j.jobCode}`, j.taskDescription));

    // 5. Initialize Excel Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Chi tiết công việc');

    // Setup columns
    sheet.columns = [
        { header: 'Ngày', key: 'date', width: 12 },
        { header: 'Mã Job', key: 'job', width: 15 },
        { header: 'Nội dung Job (Gốc)', key: 'job_static', width: 30 },
        { header: 'Mô tả chi tiết', key: 'desc', width: 40 },
        { header: 'Thời gian làm', key: 'time_range', width: 25 },
        { header: 'Tổng giờ', key: 'hours', width: 10 },
        { header: 'Số Job/Ngày', key: 'job_count', width: 12 },
    ];
    // Style Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB22222' } };

    // variables to hold summary data
    let totalWorkedHours = 0;
    let totalIdleDays = 0;
    let totalJobCount = 0;
    const daysInMonth = endDate.getDate();

    // 6. loop through each day of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month - 1, d);
        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const rawDailyTasks = tasks.filter(t => {
            const taskDateStr = t.date.toISOString().split('T')[0];
            return taskDateStr === dayStr;
        });

        if (rawDailyTasks.length > 0) {
            // logic to merge tasks by job code
            const mergedTasks: any = {};
            rawDailyTasks.forEach(t => {
                const code = t.jobCode;
                const duration = (t.endTime.getTime() - t.startTime.getTime()) / 3600000;

                const startStr = formatAmPm(t.startTime);
                const endStr = formatAmPm(t.endTime);
                const timeStr = `${startStr}-${endStr}`;
                
                if (!mergedTasks[code]) {
                    const staticDesc = jobMap.get(`${t.department}_${t.jobCode}`) || '';
                    mergedTasks[code] = { 
                        job_code: code, 
                        static_desc: staticDesc, 
                        user_descs: [], 
                        total_hours: 0, 
                        time_ranges: [] 
                    };
                }
                mergedTasks[code].total_hours += duration;
                mergedTasks[code].time_ranges.push(timeStr);
                if(t.taskDescription) mergedTasks[code].user_descs.push(t.taskDescription);
            });

            const finalDailyTasks = Object.values(mergedTasks) as any[];
            
            finalDailyTasks.forEach((t, index) => {
                totalWorkedHours += t.total_hours;
                totalJobCount++; 

                const row = sheet.addRow({
                    date: dayDate.toLocaleDateString('en-CA'), // Format YYYY-MM-DD
                    job: t.job_code, 
                    job_static: t.static_desc,
                    desc: t.user_descs.join('\n'),
                    time_range: t.time_ranges.join('\n'),
                    hours: Number(t.total_hours.toFixed(2)),
                    job_count: (index === 0) ? finalDailyTasks.length : ''
                });

                row.getCell('desc').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('time_range').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('job_static').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('hours').numFmt = '0.00';

                if(index === 0) {
                    row.getCell('job_count').font = { bold: true, color: { argb: 'FF0000FF' } };
                    row.getCell('job_count').alignment = { horizontal: 'center', vertical: 'top' };
                    row.getCell('job_count').numFmt = '0';
                }
            });
        } else {
            totalIdleDays++;
            const row = sheet.addRow({
                date: dayDate.toLocaleDateString('en-CA'), job: '---', job_static: '-', desc: 'Không chọn Job Code (Nghỉ/Không làm)',
                time_range: '-', hours: 0, job_count: 0
            });
            row.eachCell((cell) => { 
                cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFF0F0F0'} }; 
                cell.font = { color: { argb: 'FF888888' }, italic: true };
            });
            row.getCell('hours').numFmt = '0.00';
            row.getCell('job_count').numFmt = '0';
        }
    }

    // 7. Footer Summary
    sheet.addRow({});
    let rStart = sheet.rowCount + 1;
    
    const addSummaryRow = (text: string, val: string, color: string) => {
        const r = sheet.addRow([text, '', '', '', '', val]);
        sheet.mergeCells(`A${rStart}:E${rStart}`);
        r.getCell(1).font = { bold: true };
        r.getCell(6).font = { bold: true, color: { argb: color } };
        rStart++;
    };

    addSummaryRow('TỔNG KẾT THÁNG:', '', 'FF000000');
    addSummaryRow('1. Tổng giờ làm việc thực tế:', `${totalWorkedHours.toFixed(2)} giờ`, 'FF008000');
    addSummaryRow('2. Tổng số ngày không làm:', `${totalIdleDays} ngày`, 'FFFF0000');
    addSummaryRow('3. Tổng số đầu việc (Job) đã làm:', `${totalJobCount} job`, 'FF0000FF');

    return { workbook, filename: `BAOCAO_USER_${user.username}_${month}_${year}.xlsx` };
  },


  // ==========================================================================
  // 2. JOB REPORT 
  // ==========================================================================
  //function to generate job report
  generateJobReport: async (month: number, year: number, jobCode?: string, requester?: ReportRequester | null) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 1.take all tasks in that month from DB
    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(requester && requester.role === 'admin_dept'
          ? { department: { in: requester.departmentIds } }
          : {})
      }
    });
    
    // Map User (userId -> username)
    const users = await prisma.user.findMany();
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.username));

    // Map Job (jobCode -> description)
    const jobs = await prisma.jobCode.findMany();
    const jobMap = new Map();
    jobs.forEach(j => jobMap.set(`${j.department}_${j.jobCode}`, j.taskDescription));

    // take all departments
    const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });

    const scopedDepts = requester && requester.role === 'admin_dept'
      ? depts.filter(d => requester.departmentIds.includes(d.id))
      : depts;

    if (jobCode) {
      const targetJob = jobs.find(j => j.jobCode === jobCode);
      if (!targetJob) throw new Error('Job code not found');
      if (!isRequesterAllowedForDept(requester, targetJob.department)) {
        throw new Error('FORBIDDEN: You do not have permission to view this job report');
      }

      const tasks = await prisma.task.findMany({
        where: {
          jobCode,
          department: targetJob.department,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Chi tiết jobcode');

      sheet.columns = [
        { header: 'Nhân viên', key: 'username', width: 30, style: { alignment: { vertical: 'middle', wrapText: true } } },
        { header: 'Số đầu việc', key: 'taskCount', width: 12, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Tổng giờ', key: 'hours', width: 12, style: { alignment: { horizontal: 'right', vertical: 'middle' } } },
        { header: 'Thời gian làm', key: 'timeRanges', width: 32, style: { alignment: { vertical: 'middle', wrapText: true } } }
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0069D9' } };
      sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      // Create a single merged info cell spanning the data columns so long texts
      // (phòng ban / mô tả) display fully. Use new lines inside the cell and enable wrap.
      const infoText = [
        `Jobcode: ${jobCode}`,
        `Phòng ban: ${depts.find(d => d.id === targetJob.department)?.name || targetJob.department}`,
        `Mô tả: ${targetJob.taskDescription || ''}`
      ].join('\n');
      // Add the info row as an explicit 4-column row and merge it.
      const infoRow = sheet.addRow([infoText, '', '', '']);
      sheet.mergeCells(`A${infoRow.number}:D${infoRow.number}`);
      const mergedCell = sheet.getCell(`A${infoRow.number}`);
      mergedCell.font = { bold: true };
      mergedCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      infoRow.height = Math.max(45, infoText.split('\n').length * 24);
      sheet.getColumn(1).width = 60;
      sheet.getColumn(2).width = 18;
      sheet.getColumn(3).width = 18;
      sheet.getColumn(4).width = 70;
      sheet.addRow([]);

      const employeeMap = new Map<string, { username: string; hours: number; taskCount: number; timeRanges: string[] }>();
      tasks.forEach(task => {
        const username = userMap.get(task.userId) || 'Unknown';
        const current = employeeMap.get(task.userId) || { username, hours: 0, taskCount: 0, timeRanges: [] };
        current.hours += (task.endTime.getTime() - task.startTime.getTime()) / 3600000;
        current.taskCount += 1;
        current.timeRanges.push(`${formatAmPm(task.startTime)} - ${formatAmPm(task.endTime)}`);
        employeeMap.set(task.userId, current);
      });

      if (employeeMap.size === 0) {
        const emptyRow = sheet.addRow(['(Không có dữ liệu)', '', '', '']);
        emptyRow.font = { italic: true, color: { argb: 'FF888888' } };
      } else {
        Array.from(employeeMap.values())
          .sort((a, b) => b.hours - a.hours || a.username.localeCompare(b.username))
          .forEach(item => {
            const row = sheet.addRow({
              username: item.username,
              taskCount: item.taskCount,
              hours: Number(item.hours.toFixed(2)),
              timeRanges: item.timeRanges.join('\n')
            });
            row.getCell('taskCount').numFmt = '0';
            row.getCell('taskCount').alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell('hours').numFmt = '0.00';
            row.getCell('hours').alignment = { horizontal: 'right', vertical: 'middle' };
            row.getCell('username').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            row.getCell('timeRanges').alignment = { vertical: 'middle', wrapText: true };
          });
      }

      const totalHours = tasks.reduce(
        (sum, task) => sum + ((task.endTime.getTime() - task.startTime.getTime()) / 3600000),
        0
      );
      const summaryRow = sheet.addRow(['Tổng giờ của toàn bộ jobcode', '', Number(totalHours.toFixed(2)), '']);
      summaryRow.font = { bold: true };
      summaryRow.getCell('A').alignment = { horizontal: 'left', vertical: 'middle' };
      summaryRow.getCell('C').numFmt = '0.00';
      summaryRow.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };

      // Auto-size columns based on max content length and enable wrapping
      sheet.columns.forEach(col => {
        let maxLength = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
          // normalize cell value to string
          const v = cell.value;
          let text = '';
          if (v === null || v === undefined) text = '';
          else if (typeof v === 'string') text = v;
          else if (typeof v === 'number') text = v.toString();
          else if ((v as any).richText) text = (v as any).richText.map((r:any) => r.text).join('');
          else text = String(v);

          // consider longest line when value has newlines
          const len = Math.max(...text.split(/\r?\n/).map(l => l.length));
          if (len > maxLength) maxLength = len;

          // ensure wrapping enabled for all cells
          cell.alignment = Object.assign({}, cell.alignment, { wrapText: true, vertical: 'middle' });
        });
        // set reasonable bounds for width
        col.width = Math.min(Math.max(Math.ceil(maxLength * 1.2), 10), 100);
      });

      return { workbook, filename: `BAOCAO_CHITIET_JOBCODE_${jobCode}_${month}_${year}.xlsx` };
    }

    // 2. Initialize Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('TỔNG HỢP');

    let currentRow = 1;
    const colors = ['FFB22222', 'FF2E8B57', 'FF4169E1', 'FFDAA520', 'FF8E44AD', 'FFF39C12'];

    // function to process data for summary tables
    // function to process data for summary tables, including all job codes (charged or uncharged)
    const processData = (filterDeptId: string | null) => {
        const allJobCodesInScope = jobs.filter(j =>
            filterDeptId ? j.department === filterDeptId : true
        ).filter(job => requester && requester.role === 'admin_dept'
            ? requester.departmentIds.includes(job.department)
            : true);

        const map: any = {};
        
        // Initialize map with all job codes, even if no tasks recorded for the month
        allJobCodesInScope.forEach(job => {
            const key = job.jobCode;
            const staticDesc = jobMap.get(`${job.department}_${job.jobCode}`) || '';
            map[key] = {
                code: job.jobCode,
                desc: staticDesc,
                dept: job.department,
                totalTime: 0,
                users: new Set(),
                dates: new Set() // New: to collect dates for summary if needed
            };
        });

        // Populate with actual task data if available
        tasks.forEach(t => {
            if (filterDeptId && t.department !== filterDeptId) return;
            
            const key = t.jobCode;
            const duration = t.endTime.getTime() - t.startTime.getTime();
            const userName = userMap.get(t.userId) || 'Unknown';
            const taskDate = t.date.toLocaleDateString('en-CA'); // Format YYYY-MM-DD

            if (map[key]) { // Only update if the job code exists in allJobCodesInScope
                map[key].totalTime += duration;
                map[key].users.add(userName);
                map[key].dates.add(taskDate); // New: add date to set
            }
        });
        return Object.values(map).sort((a:any, b:any) => a.code.localeCompare(b.code));
    };

    // function to draw a summary table
    const drawTable = (title: string, data: any[], color: string, showDeptCol = false) => {
        const titleRow = summarySheet.getRow(currentRow++);
        titleRow.getCell(1).value = title.toUpperCase();
        titleRow.font = { bold: true, size: 14, color: { argb: color } };

        // Header columns
        const headerRow = summarySheet.getRow(currentRow++);
        const headers = showDeptCol 
          ? ['Mã Job', 'Nội dung Job', 'Phòng ban', 'Số lượng NV', 'Tổng giờ (h)']
          : ['Mã Job', 'Nội dung Job', 'Số lượng NV', 'Tổng giờ (h)'];
        
        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        });

        if (data.length === 0) {
            summarySheet.getRow(currentRow++).getCell(1).value = "(Không có dữ liệu)";
        } else {
            data.forEach((item: any) => {
                const r = summarySheet.getRow(currentRow++);
                const vals = [item.code, item.desc, item.users.size, Number((item.totalTime / 3600000).toFixed(2))];
                if (showDeptCol) {
                    const dName = depts.find(d => d.id === item.dept)?.name || item.dept;
                    vals.splice(2, 0, dName);
                }
                r.values = vals;
                r.getCell(2).alignment = { wrapText: true };
                r.getCell(showDeptCol ? 4 : 3).numFmt = '0';
                r.getCell(showDeptCol ? 5 : 4).numFmt = '0.00';
            });
        }
        currentRow += 2; 
    };

    // Set column widths for summary sheet
    summarySheet.columns = [{width:15}, {width:40}, {width:20}, {width:15}, {width:20}];
    
    // create summary tables
    const includeCompanySummary = !(requester && requester.role === 'admin_dept');
    let tableIndex = 1;

    if (includeCompanySummary) {
        drawTable('1. TỔNG HỢP TOÀN CÔNG TY', processData(null), 'FF000000', true);
        tableIndex = 2;
    }

    scopedDepts.forEach((d, idx) => {
        const color = colors[idx % colors.length];
        const deptData = processData(d.id);
        drawTable(`${tableIndex}. PHÒNG ${d.name}`, deptData, color, false);
        tableIndex++;
    });

    // 3. create detailed sheets per department
    scopedDepts.forEach((d, idx) => {
        const color = colors[idx % colors.length];
        const sheetName = d.name.substring(0, 30); 
        const sheet = workbook.addWorksheet(sheetName);
        
        // Header
        // Define columns for the detailed department sheet
        sheet.columns = [
            { header: 'Mã Job', key: 'code', width: 20 }, 
            { header: 'Nội dung Job', key: 'desc', width: 35 },
            { header: 'Nhân viên thực hiện', key: 'user', width: 30 }, 
            { header: 'Ngày thực hiện', key: 'dates', width: 30 }, // New column for task dates
            { header: 'Tổng thời gian (h)', key: 'time', width: 20 }
        ];
        const r1 = sheet.getRow(1);
        r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        r1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        
        // filter tasks for this department
        const deptTasks = tasks.filter(t => t.department === d.id);
        
        // Group by Job + User and collect dates
        const detailMap: any = {}; 
        deptTasks.forEach(t => {
            const uName = userMap.get(t.userId) || 'Unknown';
            const k = `${t.jobCode}|${uName}`;
            
            if (!detailMap[k]) {
                const staticDesc = jobMap.get(`${t.department}_${t.jobCode}`) || '';
                detailMap[k] = { time: 0, desc: staticDesc, dates: [] }; // Initialize dates array
            }
            detailMap[k].time += (t.endTime.getTime() - t.startTime.getTime());
            // Add unique date to the dates array
            const taskDate = t.date.toLocaleDateString('en-CA'); // Format YYYY-MM-DD
            if (!detailMap[k].dates.includes(taskDate)) {
                detailMap[k].dates.push(taskDate);
            }
        });
        
        // Sort and add rows to the detailed department sheet
        Object.keys(detailMap).sort().forEach(key => {
            const [job, user] = key.split('|');
            const item = detailMap[key];
            const row = sheet.addRow({ 
                code: job, 
                desc: item.desc || '', 
                user: user, 
                dates: item.dates.sort().join(',\n'), // Join unique dates for display
                time: Number((item.time / 3600000).toFixed(2))
            });
            row.getCell('dates').alignment = { vertical: 'middle', wrapText: true };
            row.getCell('time').numFmt = '0.00';
        });

        // Handle uncharged job codes for this department in the detailed sheet
        const allDepartmentJobs = jobs.filter(j => j.department === d.id);
        allDepartmentJobs.forEach(job => {
            let hasChargedTime = false;
            for (const key in detailMap) {
                const [jobCodeInMap, ] = key.split('|');
                if (jobCodeInMap === job.jobCode) {
                    hasChargedTime = true;
                    break;
                }
            }
            if (!hasChargedTime) {
                sheet.addRow({
                    code: job.jobCode,
                    desc: jobMap.get(`${job.department}_${job.jobCode}`) || '',
                    user: '(No employees assigned)', // English comment
                    dates: '(No dates recorded)', // English comment
                    time: 0
                }).eachCell(cell => {
                    cell.font = { italic: true, color: { argb: 'FF888888' } };
                });
                sheet.getCell(`E${sheet.rowCount}`).numFmt = '0.00';
            }
        });
    });

    // 4. Add a summary table for uncharged job codes (across all departments)
    const allJobCodes = scopedDepts.length > 0
      ? jobs.filter(job => scopedDepts.some(d => d.id === job.department))
      : jobs;
    const chargedJobCodes = new Set(tasks.map(t => t.jobCode));
    const unchargedJobCodes = allJobCodes.filter(job => !chargedJobCodes.has(job.jobCode));

    if (unchargedJobCodes.length > 0) {
        tableIndex++;
        const unchargedData = unchargedJobCodes.map(job => ({
            code: job.jobCode,
            desc: jobMap.get(`${job.department}_${job.jobCode}`) || 
                  (depts.find(d => d.id === job.department)?.name + " - " + job.jobCode + " (No description)"), // Fallback description
            dept: job.department,
            totalTime: 0,
            users: new Set(),
            dates: new Set()
        }));
        drawTable(`${tableIndex}. CÁC JOB CODE CHƯA CÓ NHÂN VIÊN THỰC HIỆN`, unchargedData, 'FF808080', true); // Grey color for uncharged jobs
    }

    const departmentSuffix = requester && requester.role === 'admin_dept'
      ? '_' + scopedDepts.map(d => d.name.replace(/\s+/g, '_')).join('_')
      : '';

    return { workbook, filename: `BAOCAO_JOBCODE_THANG_${month}_NAM_${year}${departmentSuffix}.xlsx` };
  }
};
