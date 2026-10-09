-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'EMAIL');

-- CreateEnum
CREATE TYPE "OutreachPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'POSTING', 'POSTED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LeadInterest" AS ENUM ('UNKNOWN', 'OPENED', 'CLICKED', 'INTERESTED', 'REPLIED', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "OutreachPost" (
    "id" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "status" "OutreachPostStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "permalink" TEXT,
    "mediaUrl" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "error" TEXT,
    "context" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceSlug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "brief" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "osmId" TEXT,
    "source" TEXT NOT NULL,
    "consentSource" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "token" TEXT NOT NULL,
    "interest" "LeadInterest" NOT NULL DEFAULT 'UNKNOWN',
    "score" INTEGER NOT NULL DEFAULT 0,
    "lastTouchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTouch" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignTouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestrationRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "summary" JSONB,

    CONSTRAINT "OrchestrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachPost_status_scheduledAt_idx" ON "OutreachPost"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "OutreachPost_channel_scheduledAt_idx" ON "OutreachPost"("channel", "scheduledAt");

-- CreateIndex
CREATE INDEX "Campaign_status_city_idx" ON "Campaign"("status", "city");

-- CreateIndex
CREATE INDEX "Campaign_createdById_idx" ON "Campaign"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignLead_token_key" ON "CampaignLead"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignLead_campaignId_osmId_key" ON "CampaignLead"("campaignId", "osmId");

-- CreateIndex
CREATE INDEX "CampaignLead_campaignId_interest_idx" ON "CampaignLead"("campaignId", "interest");

-- CreateIndex
CREATE INDEX "CampaignLead_email_idx" ON "CampaignLead"("email");

-- CreateIndex
CREATE INDEX "CampaignTouch_campaignId_createdAt_idx" ON "CampaignTouch"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignTouch_leadId_kind_idx" ON "CampaignTouch"("leadId", "kind");

-- AddForeignKey
ALTER TABLE "OutreachPost" ADD CONSTRAINT "OutreachPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLead" ADD CONSTRAINT "CampaignLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTouch" ADD CONSTRAINT "CampaignTouch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTouch" ADD CONSTRAINT "CampaignTouch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CampaignLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
