import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const aiBudget=sqliteTable('ai_budget',{id:text('id').primaryKey(),used:integer('used').notNull().default(0)});
export const checkoutLimits=sqliteTable('checkout_limits',{id:text('id').primaryKey(),used:integer('used').notNull().default(0),expires:integer('expires').notNull()});
export const payments=sqliteTable('payments',{id:text('id').primaryKey(),owner:text('owner').notNull(),session:text('session').unique(),intent:text('intent'),state:text('state').notNull(),amount:integer('amount').notNull().default(200),reviewCount:integer('review_count').notNull().default(1),reviewsDelivered:integer('reviews_delivered').notNull().default(0),refundAmount:integer('refund_amount').notNull().default(0),currency:text('currency').notNull().default('eur'),attempt:text('attempt'),leaseUntil:integer('lease_until'),deliveryHash:text('delivery_hash'),refundId:text('refund_id'),refundRetryAt:integer('refund_retry_at').notNull().default(0),reserved:integer('reserved').notNull().default(0),checkoutUntil:integer('checkout_until'),checkoutOrigin:text('checkout_origin'),checkoutLanguage:text('checkout_language'),termsVersion:text('terms_version')},table=>[
 index('payments_owner_index').on(table.owner),
 uniqueIndex('payments_active_owner').on(table.owner).where(sql`${table.state} IN ('pending','paid','processing','delivery_pending','refund_pending','refund_failed')`)
]);

export const paymentDeliveries=sqliteTable('payment_deliveries',{tokenHash:text('token_hash').primaryKey(),paymentId:text('payment_id').notNull()});
