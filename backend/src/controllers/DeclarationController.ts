// backend/src/controllers/DeclarationController.ts
// Handles reading and updating the declaration lock configuration.
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';
import { DeclarationService } from '../services/DeclarationService';

const getUserFromToken = async (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_2025_final_v4');
    if (!decoded?.id) return null;
    return await AuthService.getProfile(decoded.id);
  } catch (error) {
    return null;
  }
};

export const DeclarationController = {
  getCurrent: async (_req: Request, res: Response) => {
    try {
      const setting = await DeclarationService.getCurrentSetting();
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi tải cấu hình khai báo' });
    }
  },

  save: async (req: Request, res: Response) => {
    try {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });
      if (user.role !== 'admin_total') {
        return res.status(403).json({ error: 'Chỉ admin tổng mới được quản lý khai báo' });
      }

      const { mode, specificDate } = req.body;
      if (!['LOCKED', 'OPEN_ALL', 'OPEN_DATE'].includes(mode)) {
        return res.status(400).json({ error: 'Chế độ khai báo không hợp lệ' });
      }

      const setting = await DeclarationService.saveSetting(mode, specificDate, user.id);
      res.json({
        success: true,
        data: {
          id: setting.id,
          mode: setting.mode,
          specificDate: setting.specificDate ? DeclarationService.getVietnamDateKey(setting.specificDate) : null,
          updatedBy: setting.updatedBy
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Lỗi lưu cấu hình khai báo' });
    }
  }
};
