// backend/src/services/ReportService.ts
// This file handles report generation: user reports and job reports.
// and it creates Excel files with detailed formatting.
import prisma from '../config/prisma';
import * as ExcelJS from 'exceljs';

export const ReportService = {
  
  // ==========================================================================
  // 1. USER REPORT 
  // ==========================================================================
  //function to generate user report
  generateUserReport: async (userId: string, month: number, year: number) => {
    // 1. take userId, month, year as input
    // output: ExcelJS.Workbook object representing the report
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

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
            // Adjust for Vietnam timezone (UTC+7)
            const vietnamOffset = 7 * 60 * 60 * 1000;
            rawDailyTasks.forEach(t => {
                const code = t.jobCode;
                const duration = (t.endTime.getTime() - t.startTime.getTime()) / 3600000;
                
                // Adjust times for Vietnam timezone
                const localOffset = t.startTime.getTimezoneOffset() * 60 * 1000;
                const adjustedStart = new Date(t.startTime.getTime() - localOffset - vietnamOffset);
                const adjustedEnd = new Date(t.endTime.getTime() - localOffset - vietnamOffset);
                
                const startStr = adjustedStart.toISOString().split('T')[1].substr(0,5);
                const endStr = adjustedEnd.toISOString().split('T')[1].substr(0,5);
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
                    hours: t.total_hours.toFixed(2),
                    job_count: (index === 0) ? finalDailyTasks.length : ''
                });

                row.getCell('desc').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('time_range').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('job_static').alignment = { vertical: 'middle', wrapText: true };

                if(index === 0) {
                    row.getCell('job_count').font = { bold: true, color: { argb: 'FF0000FF' } };
                    row.getCell('job_count').alignment = { horizontal: 'center', vertical: 'top' };
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
  generateJobReport: async (month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 1.take all tasks in that month from DB
    const tasks = await prisma.task.findMany({
      where: { date: { gte: startDate, lte: endDate } }
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
        );

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
                const vals = [item.code, item.desc, item.users.size, (item.totalTime / 3600000).toFixed(2)];
                if (showDeptCol) {
                    const dName = depts.find(d => d.id === item.dept)?.name || item.dept;
                    vals.splice(2, 0, dName);
                }
                r.values = vals;
                r.getCell(2).alignment = { wrapText: true };
            });
        }
        currentRow += 2; 
    };

    // Set column widths for summary sheet
    summarySheet.columns = [{width:15}, {width:40}, {width:20}, {width:15}, {width:20}];
    
    // create summary tables
    drawTable('1. TỔNG HỢP TOÀN CÔNG TY', processData(null), 'FF000000', true);

    let tableIndex = 2;
    depts.forEach((d, idx) => {
        const color = colors[idx % colors.length];
        const deptData = processData(d.id);
        drawTable(`${tableIndex}. PHÒNG ${d.name}`, deptData, color, false);
        tableIndex++;
    });

    // 3. create detailed sheets per department
    depts.forEach((d, idx) => {
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
                time: (item.time / 3600000).toFixed(2) 
            });
            row.getCell('dates').alignment = { vertical: 'middle', wrapText: true };
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
                    time: '0.00'
                }).eachCell(cell => {
                    cell.font = { italic: true, color: { argb: 'FF888888' } };
                });
            }
        });
    });

    // 4. Add a summary table for uncharged job codes (across all departments)
    const allJobCodes = await prisma.jobCode.findMany();
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

    return { workbook, filename: `BAOCAO_JOBCODE_THANG_${month}_NAM_${year}.xlsx` };
  }
};