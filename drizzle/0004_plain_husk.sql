ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifyToken` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifyExpires` timestamp;