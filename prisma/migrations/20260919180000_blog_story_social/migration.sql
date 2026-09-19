-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'FACEBOOK', 'SOUNDCLOUD', 'SPOTIFY', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialMediaKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "SocialImportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "videoUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "audioUrl" TEXT;

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "rssUrl" TEXT,
    "seedPostUrl" TEXT,
    "latestPostUrl" TEXT,
    "latestImageUrl" TEXT,
    "latestVideoUrl" TEXT,
    "latestAudioUrl" TEXT,
    "latestCaption" TEXT,
    "latestFetchedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialImportJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "requestedKind" "SocialMediaKind" NOT NULL DEFAULT 'IMAGE',
    "status" "SocialImportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "sourceUrl" TEXT,
    "resultUrl" TEXT,
    "resultKind" "SocialMediaKind",
    "caption" TEXT,
    "embedHtml" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SocialImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_key" ON "SocialAccount"("userId", "platform");

-- CreateIndex
CREATE INDEX "SocialAccount_userId_isPrimary_idx" ON "SocialAccount"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "SocialImportJob_userId_createdAt_idx" ON "SocialImportJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialImportJob_status_createdAt_idx" ON "SocialImportJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialImportJob" ADD CONSTRAINT "SocialImportJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialImportJob" ADD CONSTRAINT "SocialImportJob_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
