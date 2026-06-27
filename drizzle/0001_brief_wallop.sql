CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userRole` varchar(50) NOT NULL,
	`action` varchar(255) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` varchar(100),
	`details` json,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryUid` varchar(36) NOT NULL,
	`orderId` int NOT NULL,
	`pilotId` int NOT NULL,
	`droneId` varchar(100),
	`status` enum('pre_flight','in_flight','completed','fallback','stopped') NOT NULL DEFAULT 'pre_flight',
	`pickupLat` decimal(10,8),
	`pickupLng` decimal(11,8),
	`deliveryLat` decimal(10,8),
	`deliveryLng` decimal(11,8),
	`currentLat` decimal(10,8),
	`currentLng` decimal(11,8),
	`fallbackReason` text,
	`stopReason` text,
	`preFlightChecks` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveries_deliveryUid_unique` UNIQUE(`deliveryUid`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderUid` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`merchantId` int NOT NULL,
	`pilotId` int,
	`status` enum('initiated','validated','preparing','ready','accepted','in_execution','completed','cancelled','fallback') NOT NULL DEFAULT 'initiated',
	`items` json,
	`totalAmount` decimal(10,2),
	`deliveryAddress` text,
	`pickupAddress` text,
	`zone` varchar(100),
	`estimatedTime` int,
	`actualTime` int,
	`packageWeight` decimal(5,2),
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderUid_unique` UNIQUE(`orderUid`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `dropiRole` enum('client','merchant','pilot','operator') DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `channel` enum('C1','C2','C3','admin') DEFAULT 'C1' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `zone` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;