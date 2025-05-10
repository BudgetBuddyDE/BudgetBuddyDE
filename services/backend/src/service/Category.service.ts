import {eq} from 'drizzle-orm';

import {db} from '../db/drizzleClient';
import {Categories, type TCategory, type TUpdateCategory, ZUpdateCategory} from '../db/schema';
import {Tables} from '../db/schema/general';
import {type ICRUDService} from './interfaces';
import {CRUDService} from './interfaces/CRUD.service';

export class CategoryService
  extends CRUDService<typeof Categories, TCategory>
  implements ICRUDService<TCategory['id'], TCategory, TUpdateCategory>
{
  constructor() {
    super(CategoryService.name, db, Categories, Tables.CATEGORIES);
  }

  async getById(entityId: number) {
    this.log.debug(`Fetching record with ID ${entityId} from ${this.tblName}`);
    const result = await this.db.select().from(this.tbl).where(eq(this.tbl.id, entityId)).limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async updateById(entityId: TCategory['id'], entites: TUpdateCategory) {
    const parsedPayload = ZUpdateCategory.safeParse(entites);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    let updatedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Updating record with ID ${entityId} in ${this.tblName}`);
      const result = await this.db
        .update(this.tbl)
        .set(parsedPayload.data)
        .where(eq(this.tbl.id, entityId))
        .returning();
      this.log.debug(`Updated ${result.length} records in ${this.tblName}`);
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row updated in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row updated');
      }

      updatedEntity = result[0];
    });

    return updatedEntity;
  }

  async deleteById(entityId: TCategory['id']) {
    let deletedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Deleting record with ID ${entityId} from ${this.tblName}`);
      const result = await this.db.delete(this.tbl).where(eq(this.tbl.id, entityId)).returning();
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row deleted in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row deleted');
      }

      deletedEntity = result[0];
    });

    return deletedEntity;
  }
}
