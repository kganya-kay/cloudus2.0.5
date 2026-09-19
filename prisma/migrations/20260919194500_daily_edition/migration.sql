-- AlterTable
ALTER TABLE "MediaPulseStory" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'LIVE';
ALTER TABLE "MediaPulseStory" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MediaPulseStory" ADD COLUMN "editionDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MediaPulseStory_origin_editionDate_idx" ON "MediaPulseStory"("origin", "editionDate");
