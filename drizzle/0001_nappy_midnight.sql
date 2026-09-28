CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`session` text,
	`intent` text,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_owner_unique` ON `payments` (`owner`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_session_unique` ON `payments` (`session`);