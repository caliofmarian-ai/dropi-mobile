ALTER TABLE `p2pCommunityListings` ADD `category` varchar(100);
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `itemCondition` enum('new','used','prepared','other');
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `imagePaths` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `foodSafety` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `posterDeclarations` json;
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `policyVersion` varchar(64);
--> statement-breakpoint
ALTER TABLE `p2pCommunityListings` ADD `policyAcceptedAt` timestamp;
