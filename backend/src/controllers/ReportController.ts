import { Request, Response } from 'express';
import { prisma } from '../app';
import * as ExcelJS from 'exceljs';

export const ReportController = {
  
  // ==========================================================================
  // 1. BÁO CÁO CÁ NHÂN (USER REPORT)
  // Logic: Liệt kê chi tiết từng ngày, gộp task trùng job, tính tổng công/ngày
  // ==========================================================================
  exportUserReport: async (req: Request, res: Response) => {
    try {
      const { userId, month, year } = req.query;
      
      // 1. Lấy thông tin User
      const user = await prisma.user.findUnique({ where: { id: String(userId) } });
      if (!user) return res.status(404).send("User not found");

      // 2. Tính toán ngày đầu/cuối tháng
      const m = Number(month);
      const y = Number(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0); // Ngày cuối cùng của tháng

      // 3. Lấy dữ liệu Task
      // Lưu ý: Prisma lưu ngày giờ theo UTC, nên khi so sánh ngày cần cẩn thận.
      // Để đơn giản và giống logic cũ, ta lấy rộng ra rồi filter bằng chuỗi YYYY-MM-DD
      const tasks = await prisma.task.findMany({
        where: {
          userId: String(userId),
          date: { gte: startDate, lte: endDate }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      });

      // 4. Lấy danh sách Job Code để map "Nội dung gốc" (Static Description)
      // Logic cũ join: t.job_code = j.job_code AND t.department = j.department
      const allJobs = await prisma.jobCode.findMany();
      const jobMap = new Map();
      allJobs.forEach(j => {
          // Tạo key: "MãPhòng_MãJob" để tra cứu chính xác
          jobMap.set(`${j.department}_${j.jobCode}`, j.taskDescription);
      });

      // 5. Khởi tạo Excel
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Chi tiết công việc');

      // Setup Columns (Y chang bản cũ)
      sheet.columns = [
        { header: 'Ngày', key: 'date', width: 12 },
        { header: 'Mã Job', key: 'job', width: 15 },
        { header: 'Nội dung Job (Gốc)', key: 'job_static', width: 30 },
        { header: 'Mô tả chi tiết', key: 'desc', width: 40 },
        { header: 'Thời gian làm', key: 'time_range', width: 25 },
        { header: 'Tổng giờ', key: 'hours', width: 10 },
        { header: 'Số Job/Ngày', key: 'job_count', width: 12 },
      ];

      // Style Header (Màu đỏ thương hiệu)
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB22222' } };

      let totalWorkedHours = 0;
      let totalIdleDays = 0;
      let totalJobCount = 0;
      const daysInMonth = endDate.getDate();

      // 6. Vòng lặp duyệt từng ngày trong tháng
      for (let d = 1; d <= daysInMonth; d++) {
        // Tạo chuỗi ngày YYYY-MM-DD để so sánh (Lưu ý tháng trong JS bắt đầu từ 0)
        const currentDayDate = new Date(y, m - 1, d);
        // Format YYYY-MM-DD thủ công để tránh lệch múi giờ
        const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Lọc task của ngày này
        const dailyTasks = tasks.filter(t => {
            const taskDateStr = t.date.toISOString().split('T')[0];
            return taskDateStr === dayStr;
        });

        if (dailyTasks.length > 0) {
            // --- LOGIC GỘP TASK (Aggregation) ---
            const mergedTasks: any = {};
            
            dailyTasks.forEach(t => {
                const code = t.jobCode;
                const duration = (t.endTime.getTime() - t.startTime.getTime()) / 3600000;
                
                // Format giờ: HH:mm
                const startStr = t.startTime.toISOString().split('T')[1].substr(0,5);
                const endStr = t.endTime.toISOString().split('T')[1].substr(0,5);
                const timeStr = `${startStr}-${endStr}`;
                
                // Lấy nội dung gốc từ Map
                const staticDesc = jobMap.get(`${t.department}_${t.jobCode}`) || '';

                if (!mergedTasks[code]) {
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
                if (t.taskDescription) mergedTasks[code].user_descs.push(t.taskDescription);
            });

            const finalDailyTasks = Object.values(mergedTasks);

            // Ghi vào Excel
            finalDailyTasks.forEach((t: any, index) => {
                totalWorkedHours += t.total_hours;
                totalJobCount++;

                const row = sheet.addRow({
                    date: dayStr,
                    job: t.job_code,
                    job_static: t.static_desc,
                    desc: t.user_descs.join('\n'), // Xuống dòng trong ô
                    time_range: t.time_ranges.join('\n'),
                    hours: t.total_hours.toFixed(2),
                    job_count: (index === 0) ? finalDailyTasks.length : ''
                });

                // Formatting Cells (Wrap text, căn giữa)
                row.getCell('desc').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('time_range').alignment = { vertical: 'middle', wrapText: true };
                row.getCell('job_static').alignment = { vertical: 'middle', wrapText: true };
                
                if (index === 0) {
                    row.getCell('job_count').font = { bold: true, color: { argb: 'FF0000FF' } };
                    row.getCell('job_count').alignment = { horizontal: 'center', vertical: 'top' };
                }
            });

        } else {
            // --- NGÀY NGHỈ (Idle Day) ---
            totalIdleDays++;
            const row = sheet.addRow({
                date: dayStr, job: '---', job_static: '-', desc: 'Không chọn Job Code (Nghỉ/Không làm)',
                time_range: '-', hours: 0, job_count: 0
            });
            // Tô màu xám cho dòng nghỉ
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
                cell.font = { color: { argb: 'FF888888' }, italic: true };
            });
        }
      }

      // 7. Footer Summary (Tổng kết cuối file)
      sheet.addRow({});
      let rStart = sheet.rowCount + 1;
      
      const addSummaryRow = (text: string, val: string, color: string) => {
          const r = sheet.addRow([text, '', '', '', '', val]);
          sheet.mergeCells(`A${rStart}:E${rStart}`); // Merge 5 ô đầu làm tiêu đề
          r.getCell(1).font = { bold: true };
          r.getCell(6).font = { bold: true, color: { argb: color } };
          rStart++;
      };

      addSummaryRow('TỔNG KẾT THÁNG:', '', 'FF000000');
      addSummaryRow('1. Tổng giờ làm việc thực tế:', `${totalWorkedHours.toFixed(2)} giờ`, 'FF008000'); // Xanh
      addSummaryRow('2. Tổng số ngày không làm (trống):', `${totalIdleDays} ngày`, 'FFFF0000'); // Đỏ
      addSummaryRow('3. Tổng số đầu việc (Job) đã làm:', `${totalJobCount} job`, 'FF0000FF'); // Xanh dương

      // Xuất file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=BAOCAO_NHANVIEN_${user.username.toUpperCase()}_THANG_${month}_NAM_${year}.xlsx`);      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi xuất báo cáo user");
    }
  },

  // ==========================================================================
  // 2. BÁO CÁO TỔNG HỢP (JOB REPORT)
  // Logic: Tạo sheet Tổng hợp + Các sheet chi tiết cho từng phòng ban
  // ==========================================================================
  exportJobReport: async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const m = Number(month);
      const y = Number(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);

      // 1. Lấy dữ liệu cần thiết
      // Lấy hết tasks trong tháng
      const tasks = await prisma.task.findMany({
        where: { date: { gte: startDate, lte: endDate } }
      });
      
      // Lấy map User (để hiện tên thay vì ID)
      const users = await prisma.user.findMany();
      const userMap = new Map();
      users.forEach(u => userMap.set(u.id, u.username));

      // Lấy map Job (để hiện description gốc)
      const jobs = await prisma.jobCode.findMany();
      const jobMap = new Map();
      jobs.forEach(j => jobMap.set(`${j.department}_${j.jobCode}`, j.taskDescription));

      // Lấy danh sách phòng ban (để loop tạo bảng)
      const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });

      // 2. Tạo Excel
      const workbook = new ExcelJS.Workbook();
      const summarySheet = workbook.addWorksheet('TỔNG HỢP'); // Sheet 1

      // Cấu hình hàm vẽ bảng (Port từ app.js)
      let currentRow = 1;
      const colors = ['FFB22222', 'FF2E8B57', 'FF4169E1', 'FFDAA520', 'FF8E44AD', 'FFF39C12'];

      // Helper: Xử lý dữ liệu (Group by Job Code)
const processData = (filterDeptId: string | null) => {
    const map: any = {};
    tasks.forEach(t => {
        // ✅ FIX: Compare ID with ID
        if (filterDeptId && t.department !== filterDeptId) return;
        
        const key = t.jobCode;
        const staticDesc = jobMap.get(`${t.department}_${t.jobCode}`) || '';
        const duration = t.endTime.getTime() - t.startTime.getTime();
        const userName = userMap.get(t.userId) || 'Unknown';

        if (!map[key]) {
            map[key] = {
                code: t.jobCode,
                desc: staticDesc,
                dept: t.department, // This is an ID
                totalTime: 0,
                users: new Set()
            };
        }
        map[key].totalTime += duration;
        map[key].users.add(userName);
    });
    return Object.values(map).sort((a:any, b:any) => a.code.localeCompare(b.code));
};

      // Helper: Vẽ bảng lên Excel
      const drawTable = (title: string, data: any[], color: string, showDeptCol = false) => {
          // Tiêu đề bảng
          const titleRow = summarySheet.getRow(currentRow++);
          titleRow.getCell(1).value = title.toUpperCase();
          titleRow.font = { bold: true, size: 14, color: { argb: color } };

          // Header cột
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
          currentRow += 2; // Cách 2 dòng cho bảng tiếp theo
      };

      // Set độ rộng cột cho Sheet Tổng hợp
      summarySheet.columns = [{width:15}, {width:40}, {width:20}, {width:15}, {width:20}];

      // --- BƯỚC VẼ BẢNG ---
      
      // 1. Bảng Tổng hợp Toàn công ty (Màu đen)
      drawTable('1. TỔNG HỢP TOÀN CÔNG TY', processData(null), 'FF000000', true);

      // 2. Các bảng con theo từng phòng ban
      let tableIndex = 2;
      depts.forEach((d, idx) => {
    const color = colors[idx % colors.length];
    const deptData = processData(d.id); // ✅ Pass ID
    drawTable(`${tableIndex}. PHÒNG ${d.name}`, deptData, color, false);
    tableIndex++;
});

      // --- BƯỚC TẠO SHEET CHI TIẾT (Detail Sheets) ---
      // Mỗi phòng ban 1 Sheet riêng
      depts.forEach((d, idx) => {
          const color = colors[idx % colors.length];
          // Tên sheet tối đa 31 ký tự, tránh lỗi Excel
          const sheetName = d.name.substring(0, 30); 
          const sheet = workbook.addWorksheet(sheetName);
          
          // Header
          sheet.columns = [
              { header: 'Mã Job', key: 'code', width: 20 }, 
              { header: 'Nội dung Job', key: 'desc', width: 35 },
              { header: 'Nhân viên thực hiện', key: 'user', width: 30 }, 
              { header: 'Tổng thời gian (h)', key: 'time', width: 20 }
          ];
          const r1 = sheet.getRow(1);
          r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
          r1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          
          // Lọc task của phòng này
          //const deptTasks = tasks.filter(t => t.department === d.code);
const deptTasks = tasks.filter(t => t.department === d.id);
          
          // Group by Job + User (Để biết: Job A do ông B làm bao nhiêu tiếng)
          const detailMap: any = {}; 
          deptTasks.forEach(t => {
              const uName = userMap.get(t.userId) || 'Unknown';
              const k = `${t.jobCode}|${uName}`;
              
              if (!detailMap[k]) {
                  const staticDesc = jobMap.get(`${t.department}_${t.jobCode}`) || '';
                  detailMap[k] = { time: 0, desc: staticDesc };
              }
              detailMap[k].time += (t.endTime.getTime() - t.startTime.getTime());
          });
          
          // Sort và ghi vào sheet
          Object.keys(detailMap).sort().forEach(key => {
              const [jobCode, userName] = key.split('|');
              sheet.addRow({ 
                  code: jobCode, 
                  desc: detailMap[key].desc, 
                  user: userName, 
                  time: (detailMap[key].time / 3600000).toFixed(2) 
              });
          });
      });

      // Xuất file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=BAOCAO_JOBCODE_THANG_${month}_NAM_${year}.xlsx`);      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi xuất báo cáo Job");
    }
  }
};