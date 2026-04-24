/*
  Warnings:

  - You are about to drop the column `createdAt` on the `links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "links" RENAME COLUMN "createdAt" TO "expireAt";
