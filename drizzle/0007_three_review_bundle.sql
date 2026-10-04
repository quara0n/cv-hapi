ALTER TABLE `payments` ADD `amount` integer DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `review_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `reviews_delivered` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `refund_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE payments SET reviews_delivered=1 WHERE state='used';--> statement-breakpoint
CREATE TABLE `payment_deliveries` (`token_hash` text PRIMARY KEY NOT NULL, `payment_id` text NOT NULL);--> statement-breakpoint
INSERT INTO payment_deliveries(token_hash,payment_id) SELECT delivery_hash,id FROM payments WHERE state='used' AND delivery_hash IS NOT NULL;
