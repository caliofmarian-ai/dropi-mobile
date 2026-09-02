-- BATCH-021 Privacy Controls — consent ledger, retention evidence, audit classification
ALTER TABLE `auditLogs` ADD `retentionClass` enum('operational','security','financial') NOT NULL DEFAULT 'operational';
--> statement-breakpoint
CREATE INDEX `auditLogs_retention_class_created_idx` ON `auditLogs` (`retentionClass`,`createdAt`);
--> statement-breakpoint
CREATE TABLE `privacyConsents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purposeKey` varchar(100) NOT NULL,
	`purposeVersion` int NOT NULL,
	`granted` boolean NOT NULL,
	`source` enum('app','web','operator','system') NOT NULL DEFAULT 'app',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacyConsents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `privacyConsents_user_purpose_created_idx` ON `privacyConsents` (`userId`,`purposeKey`,`createdAt`);
--> statement-breakpoint
CREATE TABLE `privacyRetentionRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`startedBy` int NOT NULL,
	`runMode` enum('dry_run','execute') NOT NULL DEFAULT 'execute',
	`status` enum('completed','failed') NOT NULL,
	`eligibleCount` int NOT NULL DEFAULT 0,
	`affectedCount` int NOT NULL DEFAULT 0,
	`details` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `privacyRetentionRuns_id` PRIMARY KEY(`id`)
);
