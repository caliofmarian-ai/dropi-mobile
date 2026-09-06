-- DROPi-owned account media persistence for Railway deployments without Manus/Forge storage.
-- Profile photos are public-readable through a governed route; verification evidence remains owner/admin only.
CREATE TABLE `dropiAccountMedia` (
  `id` int AUTO_INCREMENT NOT NULL,
  `mediaUid` varchar(36) NOT NULL,
  `ownerId` int,
  `purpose` enum('profile_photo','verification_document','generated_asset','private_asset') NOT NULL,
  `sourceKey` varchar(500) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `contentType` varchar(80) NOT NULL,
  `byteLength` int NOT NULL,
  `sha256` varchar(64) NOT NULL,
  `dataBase64` longtext NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `dropiAccountMedia_id` PRIMARY KEY(`id`),
  CONSTRAINT `dropiAccountMedia_mediaUid_unique` UNIQUE(`mediaUid`)
);
--> statement-breakpoint
CREATE INDEX `dropiAccountMedia_owner_idx` ON `dropiAccountMedia` (`ownerId`,`createdAt`);
--> statement-breakpoint
CREATE INDEX `dropiAccountMedia_purpose_idx` ON `dropiAccountMedia` (`purpose`,`createdAt`);
