CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`deviceInfo` varchar(255),
	`ipAddress` varchar(45),
	`isPhantom` boolean NOT NULL DEFAULT false,
	`phantomAdminId` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `dropiRole` enum('customer','merchant','delivery_partner','support_agent','analyst','compliance_officer','fraud_detection','performance_monitor','incident_responder','operations_manager','logistics_coordinator','fleet_manager','c2_compliance_officer','c2_performance_monitor','c2_incident_responder','data_analyst','quality_assurance','emergency_coordinator','dispatch_manager','resource_allocator','communication_officer','c3_data_analyst','incident_commander','system_administrator','security_officer','audit_manager','configuration_manager','analytics_manager','support_coordinator') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `channel` enum('C1','C2','C3','ADMIN') NOT NULL DEFAULT 'C1';--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `channel` enum('C1','C2','C3','ADMIN');--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `isAIAction` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `isPhantomMode` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `phantomAdminId` int;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `ipAddress` varchar(45);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `userAgent` varchar(500);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `sessionId` varchar(100);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `duration` int;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isAIAgent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `agentMode` enum('autonomous','assistant');--> statement-breakpoint
ALTER TABLE `users` ADD `humanPairId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `lastIp` varchar(45);--> statement-breakpoint
ALTER TABLE `users` ADD `lastDevice` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `failedLoginAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lockedUntil` timestamp;