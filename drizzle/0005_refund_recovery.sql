DROP INDEX `payments_active_owner`;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_active_owner` ON `payments` (`owner`) WHERE "payments"."state" IN ('pending','paid','processing','delivery_pending','refund_pending','refund_failed');
--> statement-breakpoint
UPDATE payments SET lease_until=(unixepoch()+86400)*1000 WHERE state='paid' AND lease_until IS NULL;
