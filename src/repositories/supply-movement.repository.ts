import type { ModuleDatabaseAPI } from '@coongro/plugin-sdk';
import { eq } from 'drizzle-orm';

import { supplyMovementTable } from '../schema/supply-movement.js';
import type { SupplyMovementRow, NewSupplyMovementRow } from '../schema/supply-movement.js';

export class SupplyMovementRepository {
  constructor(private readonly db: ModuleDatabaseAPI) {}

  async list(): Promise<SupplyMovementRow[]> {
    return this.db.ormQuery((tx) => tx.select().from(supplyMovementTable));
  }

  async getById({ id }: { id: string }): Promise<SupplyMovementRow | undefined> {
    const rows = await this.db.ormQuery((tx) =>
      tx.select().from(supplyMovementTable).where(eq(supplyMovementTable.id, id)).limit(1)
    );
    return rows[0];
  }

  async create({ data }: { data: NewSupplyMovementRow }): Promise<SupplyMovementRow[]> {
    return this.db.ormQuery((tx) => tx.insert(supplyMovementTable).values(data).returning());
  }

  async update({
    id,
    data,
  }: {
    id: string;
    data: Partial<NewSupplyMovementRow>;
  }): Promise<SupplyMovementRow[]> {
    return this.db.ormQuery((tx) =>
      tx.update(supplyMovementTable).set(data).where(eq(supplyMovementTable.id, id)).returning()
    );
  }

  async delete({ id }: { id: string }): Promise<void> {
    await this.db.ormQuery((tx) =>
      tx.delete(supplyMovementTable).where(eq(supplyMovementTable.id, id))
    );
  }
}
