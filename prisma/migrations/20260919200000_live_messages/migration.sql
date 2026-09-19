-- CreateTable
CREATE TABLE "LiveMessage" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveMessage_scope_scopeId_createdAt_idx" ON "LiveMessage"("scope", "scopeId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveMessage_userId_idx" ON "LiveMessage"("userId");

-- AddForeignKey
ALTER TABLE "LiveMessage" ADD CONSTRAINT "LiveMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
