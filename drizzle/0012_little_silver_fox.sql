CREATE TABLE `inAppNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`isRead` boolean NOT NULL DEFAULT false,
	`data` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inAppNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pushVerification` boolean NOT NULL DEFAULT true,
	`pushMissions` boolean NOT NULL DEFAULT true,
	`pushOrders` boolean NOT NULL DEFAULT true,
	`pushSystem` boolean NOT NULL DEFAULT true,
	`pushPromotions` boolean NOT NULL DEFAULT false,
	`pushSecurity` boolean NOT NULL DEFAULT true,
	`inAppVerification` boolean NOT NULL DEFAULT true,
	`inAppMissions` boolean NOT NULL DEFAULT true,
	`inAppOrders` boolean NOT NULL DEFAULT true,
	`inAppSystem` boolean NOT NULL DEFAULT true,
	`inAppPromotions` boolean NOT NULL DEFAULT true,
	`inAppSecurity` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`)
);
