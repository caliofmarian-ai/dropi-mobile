-- Multi-attachment private evidence for Delivery Partner verification records.
-- Existing `verifications.documentUrl` remains untouched for backward compatibility.
CREATE TABLE `verificationEvidenceAttachments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `verificationId` int NOT NULL,
  `mediaUid` varchar(36) NOT NULL,
  `label` enum('front','back','page','evidence') NOT NULL DEFAULT 'evidence',
  `ordinal` int NOT NULL DEFAULT 0,
  `fileName` varchar(255) NOT NULL,
  `contentType` varchar(80) NOT NULL,
  `byteLength` int NOT NULL,
  `sha256` varchar(64) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `verificationEvidenceAttachments_id` PRIMARY KEY(`id`),
  CONSTRAINT `verificationEvidenceAttachments_verification_fk` FOREIGN KEY (`verificationId`) REFERENCES `verifications`(`id`) ON DELETE CASCADE,
  CONSTRAINT `verificationEvidenceAttachments_media_fk` FOREIGN KEY (`mediaUid`) REFERENCES `dropiAccountMedia`(`mediaUid`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX `verificationEvidence_verification_idx` ON `verificationEvidenceAttachments` (`verificationId`,`ordinal`);
--> statement-breakpoint
CREATE UNIQUE INDEX `verificationEvidence_media_uidx` ON `verificationEvidenceAttachments` (`mediaUid`);
