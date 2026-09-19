-- CreateEnum
CREATE TYPE "MediaPulseKind" AS ENUM ('VIDEO', 'SHORT', 'SONG', 'ALBUM', 'PODCAST', 'ARTICLE', 'PERSON', 'POST', 'PHOTO', 'CLIP', 'LIVE', 'TRAILER', 'BOOK', 'EVENT', 'BLOG');

-- CreateTable
CREATE TABLE "TopicInterest" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "userId" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaPulseStory" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "kind" "MediaPulseKind" NOT NULL,
    "title" TEXT NOT NULL,
    "dek" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "embedHtml" TEXT,
    "interestCount" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaPulseStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicInterest_topic_createdAt_idx" ON "TopicInterest"("topic", "createdAt");

-- CreateIndex
CREATE INDEX "TopicInterest_userId_idx" ON "TopicInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaPulseStory_topic_kind_sourceUrl_key" ON "MediaPulseStory"("topic", "kind", "sourceUrl");

-- CreateIndex
CREATE INDEX "MediaPulseStory_score_expiresAt_idx" ON "MediaPulseStory"("score", "expiresAt");

-- CreateIndex
CREATE INDEX "MediaPulseStory_topic_expiresAt_idx" ON "MediaPulseStory"("topic", "expiresAt");

-- AddForeignKey
ALTER TABLE "TopicInterest" ADD CONSTRAINT "TopicInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
