-- CreateTable
CREATE TABLE "help_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedById" TEXT NOT NULL,
    "contextMessage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "help_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "help_request_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "helpRequestId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "help_request_responses_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "help_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "help_request_responses_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentTask" TEXT NOT NULL,
    "isBlocked" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checkpoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checkpoint_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "activeHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "activeHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE INDEX "checkpoints_userId_createdAt_idx" ON "checkpoints"("userId", "createdAt");
