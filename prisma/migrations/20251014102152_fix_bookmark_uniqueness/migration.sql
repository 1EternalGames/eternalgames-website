/*
  Warnings:

  - A unique constraint covering the columns `[userId,contentId,contentType]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Bookmark_userId_contentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_contentType_key" ON "Bookmark"("userId", "contentId", "contentType");









