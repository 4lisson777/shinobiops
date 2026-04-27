-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invites` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `role` ENUM('TECH_LEAD', 'DEVELOPER', 'SUPPORT_LEAD', 'SUPPORT_MEMBER', 'QA') NOT NULL,
    `email` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedById` VARCHAR(30) NULL,
    `usedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invites_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('TECH_LEAD', 'DEVELOPER', 'SUPPORT_LEAD', 'SUPPORT_MEMBER', 'QA') NOT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `ninjaAlias` VARCHAR(100) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `notifyTickets` BOOLEAN NOT NULL DEFAULT true,
    `notifyBugs` BOOLEAN NOT NULL DEFAULT true,
    `soundEnabled` BOOLEAN NOT NULL DEFAULT true,
    `devStatus` ENUM('ACTIVE', 'IN_CHECKPOINT', 'BLOCKED', 'HELPING') NULL DEFAULT 'ACTIVE',
    `currentTask` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_organizationId_email_key`(`organizationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `publicId` VARCHAR(20) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('TICKET', 'BUG') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'WAITING_FOR_INFO', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `deadline` DATETIME(3) NOT NULL,
    `priorityOrder` INTEGER NOT NULL,
    `openedById` VARCHAR(30) NOT NULL,
    `assignedToId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,

    UNIQUE INDEX `tickets_publicId_key`(`publicId`),
    INDEX `tickets_organizationId_idx`(`organizationId`),
    INDEX `tickets_openedById_idx`(`openedById`),
    INDEX `tickets_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bug_reports` (
    `id` VARCHAR(30) NOT NULL,
    `ticketId` VARCHAR(30) NOT NULL,
    `affectedModule` VARCHAR(255) NOT NULL,
    `stepsToReproduce` TEXT NOT NULL,
    `expectedBehavior` TEXT NOT NULL,
    `actualBehavior` TEXT NOT NULL,
    `environment` ENUM('PRODUCTION', 'STAGING', 'OTHER') NOT NULL,
    `customerId` VARCHAR(255) NULL,

    UNIQUE INDEX `bug_reports_ticketId_key`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_events` (
    `id` VARCHAR(30) NOT NULL,
    `ticketId` VARCHAR(30) NOT NULL,
    `eventType` ENUM('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'REASSIGNED', 'SEVERITY_CHANGED', 'DEADLINE_CHANGED', 'PRIORITY_REORDERED', 'REORDER_REQUESTED', 'REORDER_APPROVED', 'REORDER_DECLINED', 'HELP_REQUESTED', 'CHECKPOINT_MENTION', 'DONE', 'CANCELLED') NOT NULL,
    `actorId` VARCHAR(30) NOT NULL,
    `metadata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_events_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reorder_requests` (
    `id` VARCHAR(30) NOT NULL,
    `ticketId` VARCHAR(30) NOT NULL,
    `requestedById` VARCHAR(30) NOT NULL,
    `requestedPosition` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `resolvedById` VARCHAR(30) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `type` ENUM('TICKET_CREATED', 'BUG_CREATED', 'TICKET_ASSIGNED', 'TICKET_STATUS_CHANGED', 'TICKET_DONE', 'TICKET_CANCELLED', 'HELP_REQUEST_NEW', 'HELP_REQUEST_RESPONDED', 'CHECKPOINT_PROMPT') NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `body` TEXT NOT NULL,
    `ticketId` VARCHAR(30) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `requiresAck` BOOLEAN NOT NULL DEFAULT false,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_userId_requiresAck_acknowledgedAt_idx`(`userId`, `requiresAck`, `acknowledgedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `help_requests` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `requestedById` VARCHAR(30) NOT NULL,
    `contextMessage` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `help_requests_organizationId_idx`(`organizationId`),
    INDEX `help_requests_requestedById_idx`(`requestedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `help_request_responses` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `helpRequestId` VARCHAR(30) NOT NULL,
    `responderId` VARCHAR(30) NOT NULL,
    `respondedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checkpoints` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `currentTask` VARCHAR(500) NOT NULL,
    `isBlocked` BOOLEAN NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `checkpoints_organizationId_idx`(`organizationId`),
    INDEX `checkpoints_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checkpoint_config` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `intervalMinutes` INTEGER NOT NULL DEFAULT 60,
    `activeHoursStart` VARCHAR(5) NOT NULL DEFAULT '09:00',
    `activeHoursEnd` VARCHAR(5) NOT NULL DEFAULT '18:00',
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `checkpoint_config_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tv_config` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `refreshInterval` INTEGER NOT NULL DEFAULT 30,

    UNIQUE INDEX `tv_config_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_notification_configs` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `role` ENUM('TECH_LEAD', 'DEVELOPER', 'SUPPORT_LEAD', 'SUPPORT_MEMBER', 'QA') NOT NULL,
    `notifyOnCreation` BOOLEAN NOT NULL DEFAULT false,
    `notifyOnAssignment` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_notification_configs_organizationId_role_key`(`organizationId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invites` ADD CONSTRAINT `invites_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invites` ADD CONSTRAINT `invites_usedById_fkey` FOREIGN KEY (`usedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invites` ADD CONSTRAINT `invites_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bug_reports` ADD CONSTRAINT `bug_reports_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_events` ADD CONSTRAINT `ticket_events_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_events` ADD CONSTRAINT `ticket_events_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reorder_requests` ADD CONSTRAINT `reorder_requests_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reorder_requests` ADD CONSTRAINT `reorder_requests_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reorder_requests` ADD CONSTRAINT `reorder_requests_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `help_requests` ADD CONSTRAINT `help_requests_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `help_requests` ADD CONSTRAINT `help_requests_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `help_request_responses` ADD CONSTRAINT `help_request_responses_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `help_request_responses` ADD CONSTRAINT `help_request_responses_helpRequestId_fkey` FOREIGN KEY (`helpRequestId`) REFERENCES `help_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `help_request_responses` ADD CONSTRAINT `help_request_responses_responderId_fkey` FOREIGN KEY (`responderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkpoints` ADD CONSTRAINT `checkpoints_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkpoints` ADD CONSTRAINT `checkpoints_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checkpoint_config` ADD CONSTRAINT `checkpoint_config_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tv_config` ADD CONSTRAINT `tv_config_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_notification_configs` ADD CONSTRAINT `role_notification_configs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
