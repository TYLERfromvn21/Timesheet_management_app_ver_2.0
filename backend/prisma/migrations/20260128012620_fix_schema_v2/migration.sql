/*
  Warnings:

  - You are about to drop the column `code` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `JobCode` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `jobCodeId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `taskDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobCode]` on the table `JobCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `department` to the `JobCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobCode` to the `JobCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskDescription` to the `JobCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobCode` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskDescription` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobCode" DROP CONSTRAINT "JobCode_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_jobCodeId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropIndex
DROP INDEX "JobCode_departmentId_code_key";

-- DropIndex
DROP INDEX "JobCode_departmentId_idx";

-- DropIndex
DROP INDEX "JobCode_isActive_idx";

-- DropIndex
DROP INDEX "Task_taskDate_idx";

-- DropIndex
DROP INDEX "Task_userId_idx";

-- DropIndex
DROP INDEX "Task_userId_taskDate_key";

-- AlterTable
ALTER TABLE "JobCode" DROP COLUMN "code",
DROP COLUMN "deletedAt",
DROP COLUMN "departmentId",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "jobCode" TEXT NOT NULL,
ADD COLUMN     "taskDescription" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "deletedAt",
DROP COLUMN "departmentId",
DROP COLUMN "description",
DROP COLUMN "jobCodeId",
DROP COLUMN "taskDate",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "jobCode" TEXT NOT NULL,
ADD COLUMN     "taskDescription" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "JobCode_jobCode_key" ON "JobCode"("jobCode");
