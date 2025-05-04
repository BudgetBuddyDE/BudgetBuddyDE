import {LoggerClient} from '@budgetbuddyde/utils';
import {type PgTable} from 'drizzle-orm/pg-core';
import {z} from 'zod';

import {logger} from '../../core/logger';
import {DrizzleDatabaseClient} from '../../db/drizzleClient';

export class CRUDService<T extends PgTable, E> {
  private readonly logger: LoggerClient;
  private readonly dbClient: DrizzleDatabaseClient;
  private readonly table: T;

  constructor(serviceName: string, dbClient: DrizzleDatabaseClient, table: T) {
    this.logger = logger.child({label: serviceName});
    this.dbClient = dbClient;
    this.table = table;

    this.logger.info(`Service ${serviceName} initialized`);
  }

  public get log() {
    return this.logger;
  }

  public get db() {
    return this.dbClient;
  }

  public get tbl() {
    return this.table;
  }

  public get tblName() {
    return this.table._.name;
  }

  async getAll() {
    return (await this.db.select().from(this.tbl as PgTable)) as E[];
  }

  async create<P>(payload: P[], payloadSchema: z.ZodSchema<any>) {
    const parsedPayload = z.array(payloadSchema).safeParse(payload);
    if (!parsedPayload.success) throw parsedPayload.error;

    const result = await this.db.insert(this.tbl).values(parsedPayload.data).returning();
    return result;
  }
}
