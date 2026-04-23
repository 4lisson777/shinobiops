-- CreateTable: role_notification_configs
CREATE TABLE "role_notification_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "notifyOnCreation" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnAssignment" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex: unique constraint on role
CREATE UNIQUE INDEX "role_notification_configs_role_key" ON "role_notification_configs"("role");
