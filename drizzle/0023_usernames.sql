ALTER TABLE `users` ADD `username` varchar(64);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);
