/*
  Warnings:

  - You are about to alter the column `departure_time` on the `flights` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `arrival_time` on the `flights` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `flights` MODIFY `departure_time` DATETIME(0) NOT NULL,
    MODIFY `arrival_time` DATETIME(0) NOT NULL;
