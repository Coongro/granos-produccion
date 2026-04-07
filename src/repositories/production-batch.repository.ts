import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq } from 'drizzle-orm';

import { productionBatchTable } from '../schema/production-batch.js';
import type { ProductionBatchRow, NewProductionBatchRow } from '../schema/production-batch.js';

export class ProductionBatchRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<ProductionBatchRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(productionBatchTable));
  }

  async getById({ id }: { id: string }): Promise<ProductionBatchRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(productionBatchTable).where(eq(productionBatchTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewProductionBatchRow }): Promise<ProductionBatchRow[]> {
    return this.db.ormQuery((tx) => tx.insert(productionBatchTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewProductionBatchRow>;
  }): Promise<ProductionBatchRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(productionBatchTable).set(data).where(eq(productionBatchTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(productionBatchTable).where(eq(productionBatchTable.id, id))
    );
  }
}
