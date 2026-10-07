DROP INDEX `payments_owner_unique`;--> statement-breakpoint
ALTER TABLE `payments` ADD `attempt` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `lease_until` integer;--> statement-breakpoint
ALTER TABLE `payments` ADD `delivery_hash` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `refund_id` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `refund_retry_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `reserved` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `checkout_until` integer;--> statement-breakpoint
ALTER TABLE `payments` ADD `checkout_origin` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `checkout_language` text;--> statement-breakpoint
CREATE INDEX `payments_owner_index` ON `payments` (`owner`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_active_owner` ON `payments` (`owner`) WHERE "payments"."state" IN ('pending','paid','processing','delivery_pending','refund_pending');
--> statement-breakpoint
UPDATE payments SET lease_until=0 WHERE state='processing';
--> statement-breakpoint
UPDATE payments SET reserved=1 WHERE state IN ('pending','paid');
