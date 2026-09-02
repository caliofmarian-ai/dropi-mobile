-- C1 P2P surfaces resolved by the frozen Marketplace canon.
-- P2P community offers and private parcels are intentionally separate from merchant stores/products/orders.
CREATE TABLE `p2pCommunityListings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `offerType` enum('donation','free_transfer','fixed_price') NOT NULL,
  `fixedPrice` decimal(10,2),
  `currency` varchar(3) NOT NULL DEFAULT 'RON',
  `zone` varchar(100) NOT NULL,
  `status` enum('pending_review','approved','rejected','closed') NOT NULL DEFAULT 'pending_review',
  `moderationNote` text,
  `moderatedBy` int,
  `moderatedAt` timestamp,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `p2pCommunityListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `p2pCommunityListings_owner_status_idx` ON `p2pCommunityListings` (`ownerId`,`status`);
--> statement-breakpoint
CREATE INDEX `p2pCommunityListings_public_idx` ON `p2pCommunityListings` (`zone`,`status`,`expiresAt`);
--> statement-breakpoint
CREATE TABLE `p2pParcelRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestUid` varchar(36) NOT NULL,
  `ownerId` int NOT NULL,
  `pickupAddress` text NOT NULL,
  `deliveryAddress` text NOT NULL,
  `packageDescription` text NOT NULL,
  `weightGrams` int NOT NULL,
  `zone` varchar(100) NOT NULL,
  `status` enum('initiated','cancelled') NOT NULL DEFAULT 'initiated',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `p2pParcelRequests_id` PRIMARY KEY(`id`),
  CONSTRAINT `p2pParcelRequests_requestUid_unique` UNIQUE(`requestUid`)
);
--> statement-breakpoint
CREATE INDEX `p2pParcelRequests_owner_status_idx` ON `p2pParcelRequests` (`ownerId`,`status`);
