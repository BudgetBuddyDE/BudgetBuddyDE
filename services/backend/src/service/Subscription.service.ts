import {eq} from 'drizzle-orm';

import {db} from '../db/drizzleClient';
import {Subscriptions, type TSubscription, type TUpdateSubscription, ZUpdateSubscription} from '../db/schema';
import {Tables} from '../db/schema/general';
import {type ICRUDService} from './interfaces';
import {CRUDService} from './interfaces/CRUD.service';

export class SubscriptionService
  extends CRUDService<typeof Subscriptions, TSubscription>
  implements ICRUDService<TSubscription['id'], TSubscription, TUpdateSubscription>
{
  constructor() {
    super(SubscriptionService.name, db, Subscriptions, Tables.SUBSCRIPTIONS);
  }

  async getById(entityId: number) {
    this.log.debug(`Fetching record with ID ${entityId} from ${this.tblName}`);
    const result = await this.db.select().from(this.tbl).where(eq(this.tbl.id, entityId)).limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async updateById(entityId: TSubscription['id'], entites: TUpdateSubscription) {
    const parsedPayload = ZUpdateSubscription.safeParse(entites);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    let updatedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Updating record with ID ${entityId} in ${this.tblName}`);
      const result = await tx.update(this.tbl).set(parsedPayload.data).where(eq(this.tbl.id, entityId)).returning();
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

  async deleteById(entityId: TSubscription['id']) {
    let deletedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Deleting record with ID ${entityId} from ${this.tblName}`);
      const result = await tx.delete(this.tbl).where(eq(this.tbl.id, entityId)).returning();
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
