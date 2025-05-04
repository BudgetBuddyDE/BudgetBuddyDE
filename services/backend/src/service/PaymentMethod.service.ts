import {eq, like, or} from 'drizzle-orm';

import {db} from '../db/drizzleClient';
import {PaymentMethods, type TPaymentMethod, type TUpdatePaymentMethod, ZUpdatePaymentMethod} from '../db/schema';
import {Tables} from '../db/schema/general';
import {type ICRUDService} from './interfaces';
import {CRUDService} from './interfaces/CRUD.service';

export class PaymentMethodService
  extends CRUDService<typeof PaymentMethods, TPaymentMethod>
  implements ICRUDService<TPaymentMethod['id'], TPaymentMethod, TUpdatePaymentMethod>
{
  constructor() {
    super(PaymentMethodService.name, db, PaymentMethods, Tables.PAYMENT_METHODS);
  }

  async search(query: string) {
    const searchExpression = `%${query}%`;
    const where = or(
      like(this.tbl.name, searchExpression),
      like(this.tbl.address, searchExpression),
      like(this.tbl.provider, searchExpression),
      like(this.tbl.description, searchExpression),
    );
    this.log.debug(`Searching for '${query}' in ${this.tblName}`);
    const matches = await this.db.select().from(this.tbl).where(where);
    this.log.debug(`Found ${matches.length} matches for '${query}' in ${this.tblName}`);
    return matches;
  }

  async getById(entityId: number) {
    this.log.debug(`Fetching record with ID ${entityId} from ${this.tblName}`);
    const result = await this.db.select().from(this.tbl).where(eq(this.tbl.id, entityId)).limit(1);
    return result.length > 0 ? result[0] : null;
  }

  async updateById(entityId: TPaymentMethod['id'], entites: TUpdatePaymentMethod) {
    const parsedPayload = ZUpdatePaymentMethod.safeParse(entites);
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

  async deleteById(entityId: TPaymentMethod['id']) {
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
