CREATE TABLE `checkout_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL
);
