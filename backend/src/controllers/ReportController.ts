//backend/src/controllers/ReportController.ts
//this file is used to handle report generation and exporting functionality

//function to remove Vietnamese tones from a string
function removeVietnameseTones(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 _-]/g, '');
}
import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';
import { verifyToken } from '../utils/jwt';
import { AuthService } from '../services/AuthService';

const getRequester = async (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');

  const decoded: any = verifyToken(token);
  if (!decoded?.id) throw new Error('Unauthorized');

  return AuthService.getProfile(decoded.id);
};

export const ReportController = {
  
  // ==========================================================================
  // 1. function to export user report as an Excel file
  // ==========================================================================
  exportUserReport: async (req: Request, res: Response) => {
    try {
      const { userId, month, year } = req.query;
      const requester = await getRequester(req);
      const result = await ReportService.generateUserReport(
        String(userId), Number(month), Number(year), {
          id: requester.id,
          role: requester.role as any,
          departmentIds: requester.departmentIds || []
        }
      );

      const safeFileName = removeVietnameseTones(result.filename);
      const encodedFileName = encodeURIComponent(result.filename);

      const buffer = await result.workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
          'Content-Disposition', 
          `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`
      );
      res.setHeader('Content-Length', buffer.byteLength);
      
      res.send(buffer);

    } catch (error: any) {
      if (!res.headersSent) {
        const message = error?.message || 'Server error';
        const status = message.startsWith('FORBIDDEN:') ? 403 : (message === 'Unauthorized' ? 401 : 500);
        res.status(status).send(message);
      }
    }
  },

  // ==========================================================================
  // 2. function to export job report as an Excel file
  // ==========================================================================
  exportJobReport: async (req: Request, res: Response) => {
    try {
      const { month, year, jobCode } = req.query;
      const requester = await getRequester(req);
      const result = await ReportService.generateJobReport(
        Number(month),
        Number(year),
        jobCode ? String(jobCode) : undefined,
        {
          id: requester.id,
          role: requester.role as any,
          departmentIds: requester.departmentIds || []
        }
      );

      const safeFileName = removeVietnameseTones(result.filename);
      const encodedFileName = encodeURIComponent(result.filename);
      
      const buffer = await result.workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader(
          'Content-Disposition', 
          `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`
      );
      res.setHeader('Content-Length', buffer.byteLength);
      
      res.send(buffer);

    } catch (error: any) {
      if (!res.headersSent) {
        const message = error?.message || 'Server error';
        const status = message.startsWith('FORBIDDEN:') ? 403 : (message === 'Unauthorized' ? 401 : 500);
        res.status(status).send(message);
      }
    }
  }
};
