import { sql } from 'drizzle-orm';
import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const productionBatchTable = pgTable('module_granos_produccion_production_batches', {
  id: uuid('id').primaryKey().notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  caliber: text('caliber').notNull(),
  kg: numeric('kg').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type ProductionBatchRow = typeof productionBatchTable.$inferSelect;
export type NewProductionBatchRow = typeof productionBatchTable.$inferInsert;
