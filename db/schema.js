import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const aiBudget=sqliteTable('ai_budget',{id:text('id').primaryKey(),used:integer('used').notNull().default(0)});
export const payments=sqliteTable('payments',{id:text('id').primaryKey(),owner:text('owner').notNull().unique(),session:text('session').unique(),intent:text('intent'),state:text('state').notNull()});
