CREATE TABLE `deliveryBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`mode` enum('drone','terrestrial','multimodal') NOT NULL,
	`isEligible` boolean NOT NULL DEFAULT true,
	`conditions` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`storeId` int NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`overallRating` int NOT NULL,
	`qualityRating` int NOT NULL,
	`comment` text,
	`isVerifiedPurchase` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`name` varchar(300) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'RON',
	`images` json,
	`category` varchar(100) NOT NULL,
	`subcategory` varchar(100),
	`weight` decimal(8,2) NOT NULL,
	`dimensions` json,
	`deliveryModes` json,
	`cancellationPolicy` json,
	`stock` int,
	`zone` varchar(100) NOT NULL,
	`status` enum('draft','pending_review','approved','rejected','suspended') NOT NULL DEFAULT 'draft',
	`moderationNote` text,
	`moderatedBy` int,
	`moderatedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT false,
	`isFragile` boolean NOT NULL DEFAULT false,
	`requiresSpecialPackaging` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`orderCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sellerBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`type` enum('high_trust','new_activity','high_risk','restricted') NOT NULL,
	`reason` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`overriddenBy` int,
	`overrideReason` text,
	CONSTRAINT `sellerBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`period` varchar(10) NOT NULL,
	`periodType` enum('daily','monthly') NOT NULL,
	`totalOrders` int NOT NULL DEFAULT 0,
	`completedOrders` int NOT NULL DEFAULT 0,
	`cancelledOrders` int NOT NULL DEFAULT 0,
	`avgRating` decimal(3,2),
	`revenue` decimal(12,2) NOT NULL DEFAULT '0',
	`commissionPaid` decimal(12,2) NOT NULL DEFAULT '0',
	`refundsIssued` decimal(12,2) NOT NULL DEFAULT '0',
	`newReviews` int NOT NULL DEFAULT 0,
	`productViews` int NOT NULL DEFAULT 0,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storeAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`logoUrl` varchar(500),
	`coverImageUrl` varchar(500),
	`type` enum('internal','external') NOT NULL DEFAULT 'internal',
	`externalUrl` varchar(500),
	`apiKey` varchar(64),
	`webhookUrl` varchar(500),
	`zone` varchar(100) NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('pending','active','suspended','closed') NOT NULL DEFAULT 'pending',
	`trustScore` int NOT NULL DEFAULT 0,
	`totalOrders` int NOT NULL DEFAULT 0,
	`totalReviews` int NOT NULL DEFAULT 0,
	`workingHours` json,
	`physicalAddress` text,
	`contactPhone` varchar(20),
	`suspendedAt` timestamp,
	`suspensionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
