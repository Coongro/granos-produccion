import { sql } from 'drizzle-orm';
import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const supplyMovementTable = pgTable('module_granos_produccion_supply_movements', {
  id: uuid('id').primaryKey().notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  supplyType: text('supply_type').notNull(),
  movementType: text('movement_type').notNull(),
  quantity: numeric('quantity').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export type SupplyMovementRow = typeof supplyMovementTable.$inferSelect;
export type NewSupplyMovementRow = typeof supplyMovementTable.$inferInsert;
