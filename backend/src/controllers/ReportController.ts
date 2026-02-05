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

export const ReportController = {
  
  // ==========================================================================
  // 1. function to export user report as an Excel file
  // ==========================================================================
  exportUserReport: async (req: Request, res: Response) => {
    try {
      const { userId, month, year } = req.query;
      const result = await ReportService.generateUserReport(
        String(userId), Number(month), Number(year)
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
      if (!res.headersSent) res.status(500).send(error.message);
    }
  },

  // ==========================================================================
  // 2. function to export job report as an Excel file
  // ==========================================================================
  exportJobReport: async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const result = await ReportService.generateJobReport(Number(month), Number(year));

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
      if (!res.headersSent) res.status(500).send(error.message);
    }
  }
};