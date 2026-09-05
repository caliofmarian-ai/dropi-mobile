-- Governed P2P listing media persistence for Railway deployments without Manus/Forge storage.
-- Media stays private until the owning listing is approved; access is enforced by the API route.
CREATE TABLE `p2pListingMedia` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mediaUid` varchar(36) NOT NULL,
  `listingId` int NOT NULL,
  `ownerId` int NOT NULL,
  `contentType` varchar(40) NOT NULL,
  `byteLength` int NOT NULL,
  `dataBase64` longtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `p2pListingMedia_id` PRIMARY KEY(`id`),
  CONSTRAINT `p2pListingMedia_mediaUid_unique` UNIQUE(`mediaUid`)
);
--> statement-breakpoint
CREATE INDEX `p2pListingMedia_listingId_idx` ON `p2pListingMedia` (`listingId`);
--> statement-breakpoint
CREATE INDEX `p2pListingMedia_ownerId_idx` ON `p2pListingMedia` (`ownerId`);
