// backend/src/services/DeclarationService.ts
// This service stores and resolves the current declaration-lock configuration.
import prisma from '../config/prisma';

export type DeclarationModeValue = 'LOCKED' | 'OPEN_ALL' | 'OPEN_DATE';

const SINGLETON_ID = 1;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const toVietnamDateKey = (value: Date | string) => {
  const date = new Date(value);
  const shifted = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
};

const normalizeSpecificDate = (value?: string | Date | null) => {
  if (!value) return null;
  const key = toVietnamDateKey(value);
  return new Date(`${key}T00:00:00.000Z`);
};

const ensureSchema = async () => {
  await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  CREATE TYPE "DeclarationMode" AS ENUM ('LOCKED', 'OPEN_ALL', 'OPEN_DATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`);

  await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "DeclarationSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mode" "DeclarationMode" NOT NULL DEFAULT 'LOCKED',
    "specificDate" TIMESTAMP(3),
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationSetting_pkey" PRIMARY KEY ("id")
);
`);
};

export const DeclarationService = {
  getVietnamDateKey: toVietnamDateKey,

  getCurrentSetting: async () => {
    await ensureSchema();

    const rows = await prisma.$queryRaw<Array<{
      id: number;
      mode: DeclarationModeValue;
      specificDate: Date | null;
      updatedBy: string | null;
    }>>`
      SELECT "id", "mode", "specificDate", "updatedBy"
      FROM "DeclarationSetting"
      WHERE "id" = ${SINGLETON_ID}
      LIMIT 1
    `;

    const setting = rows[0];

    return {
      id: SINGLETON_ID,
      mode: (setting?.mode || 'LOCKED') as DeclarationModeValue,
      specificDate: setting?.specificDate ? toVietnamDateKey(setting.specificDate) : null,
      updatedBy: setting?.updatedBy || null
    };
  },

  saveSetting: async (mode: DeclarationModeValue, specificDate?: string | Date | null, updatedBy?: string | null) => {
    await ensureSchema();

    const normalizedDate = mode === 'OPEN_DATE' ? normalizeSpecificDate(specificDate) : null;

    if (mode === 'OPEN_DATE' && !normalizedDate) {
      throw new Error('Vui lòng chọn ngày cần mở khai báo');
    }

    await prisma.$executeRaw`
      INSERT INTO "DeclarationSetting" (
        "id",
        "mode",
        "specificDate",
        "updatedBy",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${SINGLETON_ID},
        CAST(${mode} AS "DeclarationMode"),
        ${normalizedDate},
        ${updatedBy || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "mode" = CAST(${mode} AS "DeclarationMode"),
        "specificDate" = ${normalizedDate},
        "updatedBy" = ${updatedBy || null},
        "updatedAt" = CURRENT_TIMESTAMP
    `;

    return await DeclarationService.getCurrentSetting();
  },

  canEditDate: async (date: Date) => {
    const setting = await DeclarationService.getCurrentSetting();
    const targetKey = toVietnamDateKey(date);
    const todayKey = toVietnamDateKey(new Date());

    if (targetKey >= todayKey) {
      return { allowed: true, bypassCurfew: false, mode: setting.mode };
    }

    if (setting.mode === 'OPEN_ALL') {
      return { allowed: true, bypassCurfew: true, mode: setting.mode };
    }

    if (setting.mode === 'OPEN_DATE' && setting.specificDate === targetKey) {
      return { allowed: true, bypassCurfew: true, mode: setting.mode };
    }

    return { allowed: false, bypassCurfew: false, mode: setting.mode };
  }
};
