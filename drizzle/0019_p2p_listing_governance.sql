-- Governed P2P listing submission evidence.
-- New fields stay nullable so legacy pending rows remain readable; server policy enforces them for all new submissions and approvals.
ALTER TABLE `p2pCommunityListings` ADD `category` varchar(100);
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `itemCondition` enum('new','used','prepared','other');
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `imageUrls` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `foodSafety` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `attestationData` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `policyVersion` varchar(80);
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `attestedAt` timestamp;
