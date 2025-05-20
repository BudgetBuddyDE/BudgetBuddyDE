import {LoggerClient} from '@budgetbuddyde/utils';
import {SQL, like, or, sql} from 'drizzle-orm';
import {AnyPgColumn, type PgTable} from 'drizzle-orm/pg-core';
import {z} from 'zod';

import {logger} from '../../core/logger';
import {DrizzleDatabaseClient} from '../../db/drizzleClient';
import {User} from '../../models/User.model';

// export interface V2CRUDService {
//   create<P, E>(payload: P): Promise<E>;
//   getAll<E>(): Promise<E[]>;
//   getById<EID, E>(id: EID): Promise<E | null>;
//   searchByKeyword<E>(keyword: string, fields: string[]): Promise<E[]>;
//   updateById<EID, P, E>(id: EID, payload: P): Promise<E | null>;
//   deleteById<EID, E>(id: EID): Promise<E | null>;
// }

type ColumnsOf<T extends PgTable> = T['_']['columns'];
type ColumnNames<T extends PgTable> = keyof ColumnsOf<T>;

// FIXME: Improve typing of T (table)
export class CRUDService<T extends PgTable, E> {
  private readonly logger: LoggerClient;
  private readonly dbClient: DrizzleDatabaseClient;
  private readonly table: T;
  private readonly tableName: string;

  constructor(serviceName: string, dbClient: DrizzleDatabaseClient, table: T, tableName: string) {
    this.logger = logger.child({label: serviceName});
    this.dbClient = dbClient;
    this.table = table;
    this.tableName = tableName;

    this.logger.info(`Service '%s' initialized`, serviceName);
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
    return this.tableName;
  }

  static lower(field: AnyPgColumn): SQL {
    return sql`lower(${field})`;
  }

  async getAll() {
    this.log.debug(`Fetching all records from ${this.tblName}`);
    return (await this.db.select().from(this.tbl as PgTable)) as E[];
  }

  async create<P>(payload: P[], payloadSchema: z.ZodSchema<any>, user: User) {
    payload = payload.map(item => ({
      ...item,
      owner: user.id,
    }));
    const parsedPayload = z.array(payloadSchema).safeParse(payload);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    this.log.debug(`Creating records in ${this.tblName}`);

    const result = await this.db.insert(this.tbl).values(parsedPayload.data).returning();
    this.log.debug(`Created ${result.length} records in ${this.tblName}`);
    return result;
  }

  private buildSearchExpression(keyword: string): string {
    return `%${keyword.toLowerCase()}%`;
  }

  // FIXME: Improve typing of fields
  private buildSearchWhereClause(keyword: string, fields: ColumnNames<T>[]) {
    this.log.debug(
      `Building search where clause for '${keyword}' in ${this.tblName} including fields ${fields.join(', ')}`,
    );

    this.log.debug('Fields to search: ', fields);

    const searchExpression = this.buildSearchExpression(keyword);

    return or(
      ...fields.map(field =>
        like(
          // @ts-expect-error
          CRUDService.lower(this.tbl[field as keyof ColumnsOf<T>] as unknown as AnyPgColumn),
          searchExpression,
        ),
      ),
    );
  }

  // FIXME: Improve typing of fields
  async search(keyword: string, fields: ColumnNames<T>[]) {
    const where = this.buildSearchWhereClause(keyword, fields);
    this.log.debug(`Searching for '${keyword}' in ${this.tblName}`);
    const matches = await this.db
      .select()
      .from(this.tbl as PgTable)
      .where(where);
    this.log.debug(`Found ${matches.length} matches for '${keyword}' in ${this.tblName}`);
    return matches as E[];
  }
}
