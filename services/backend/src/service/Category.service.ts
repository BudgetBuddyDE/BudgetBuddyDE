import {eq, like, or} from 'drizzle-orm';

import {db} from '../db/drizzleClient';
import {Categories, type TCategory, type TUpdateCategory, ZUpdateCategory} from '../db/schema';
import {type ICRUDService} from './interfaces';
import {CRUDService} from './interfaces/CRUD.service';

export class CategoryService
  extends CRUDService<typeof Categories, TCategory>
  implements ICRUDService<TCategory['id'], TCategory, TUpdateCategory>
{
  constructor() {
    super('adsa', db, Categories);
  }

  async search(query: string) {
    const searchExpression = `%${query}%`;
    const where = or(like(Categories.name, searchExpression), like(Categories.description, searchExpression));
    const matches = await this.db.select().from(this.tbl).where(where);

    return matches;
  }

  async getById(entityId: number) {
    const result = await this.db.select().from(this.tbl).where(eq(Categories.id, entityId)).limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async updateById(entityId: TCategory['id'], entites: TUpdateCategory) {
    const parsedPayload = ZUpdateCategory.safeParse(entites);
    if (!parsedPayload.success) throw parsedPayload.error;

    let updatedEntity = null;
    await this.db.transaction(async tx => {
      const result = await this.db
        .update(this.tbl)
        .set(parsedPayload.data)
        .where(eq(Categories.id, entityId))
        .returning();
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        throw new Error('More than one row updated');
      }

      updatedEntity = result[0];
    });

    return updatedEntity;
  }

  async deleteById(entityId: TCategory['id']) {
    let deletedEntity = null;
    await this.db.transaction(async tx => {
      const result = await this.db.delete(this.tbl).where(eq(Categories.id, entityId)).returning();
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        throw new Error('More than one row deleted');
      }

      deletedEntity = result[0];
    });

    return deletedEntity;
  }
}
