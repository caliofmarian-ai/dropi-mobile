-- BATCH-022: privacy subject rights evidence ledger.
-- User rows are pseudonymized rather than hard-deleted so retained operational/audit evidence keeps stable subject references.
CREATE TABLE `privacyRightsRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `requestType` enum('access','portability','erasure') NOT NULL,
  `status` enum('requested','blocked','completed','failed') NOT NULL DEFAULT 'requested',
  `blockerSummary` json,
  `resultSummary` json,
  `requestedAt` timestamp NOT NULL DEFAULT (now()),
  `completedAt` timestamp,
  CONSTRAINT `privacyRightsRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `privacyRightsRequests_user_created_idx` ON `privacyRightsRequests` (`userId`,`requestedAt`);
