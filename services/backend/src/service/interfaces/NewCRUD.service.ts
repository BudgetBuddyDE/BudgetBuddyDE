import {LoggerClient} from '@budgetbuddyde/utils';
import {SQL, eq, getTableColumns, like, or, sql} from 'drizzle-orm';
import {AnyPgColumn, PgTable, getTableConfig} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema, createUpdateSchema} from 'drizzle-zod';
import {z} from 'zod';

import {logger} from '../../core/logger';
import {type DrizzleDatabaseClient} from '../../db/drizzleClient';

type ColumnsOf<T extends PgTable> = T['_']['columns'];
type ColumnNames<T extends PgTable> = keyof ColumnsOf<T>;

// FIXME: Replace with PgTableWithColumn??
export abstract class NewCRUDService<Table extends PgTable> {
  private readonly logger: LoggerClient;
  private readonly dbClient: DrizzleDatabaseClient;
  private readonly table: Table; // Replace 'any' with the specific (generic) type of your table
  private searchableFields: ColumnNames<Table>[] = [];

  constructor(
    serviceName: string,
    dbClient: DrizzleDatabaseClient,
    table: Table,
    searchableFields: ColumnNames<Table>[] = [],
  ) {
    this.logger = logger.child({label: serviceName});
    this.dbClient = dbClient;
    this.table = table;
    this.searchableFields = searchableFields;

    this.logger.info(`Service '%s' initialized`, serviceName);
  }

  /**
   * Logger for the service.
   */
  public get log() {
    return this.logger;
  }

  /**
   * Database client for the service.
   */
  protected get db() {
    return this.dbClient;
  }

  /**
   * Table for the service.
   */
  protected get tbl() {
    return this.table;
  }

  /**
   * Configuration of the table for the service.
   */
  protected get tblCfg() {
    return getTableConfig(this.table);
  }

  /**
   * Columns of the table for the service.
   */
  protected get tblColumns() {
    return getTableColumns(this.table);
  }

  /**
   * Name of the table for the service.
   */
  protected get tblName() {
    return this.tblCfg.name;
  }

  /**
   * Schema for selecting from the table.
   * Uses `createSelectSchema` to generate a Zod schema based on the table.
   */
  protected get selectTblSchema() {
    return createSelectSchema(this.tbl);
  }

  /**
   * Schema for inserting into the table.
   * Uses `createInsertSchema` to generate a Zod schema based on the table.
   */
  protected get insertTblSchema() {
    return createInsertSchema(this.tbl);
  }

  /**
   * Schema for updating an entry in the table.
   * Uses `createUpdateSchema` to generate a Zod schema based on the table.
   */
  protected get updateTblSchema() {
    return createUpdateSchema(this.tbl);
  }

  /**
   * Converts a field to lowercase in SQL.
   * @param field The field to convert to lowercase.
   * @returns SQL expression for the lowercase field.
   */
  protected static lower(field: AnyPgColumn): SQL {
    return sql`lower(${field})`;
  }

  /**
   * Converts a field to lowercase in SQL.
   * @param params Parameters for the lower function.
   * @returns SQL expression for the lowercase field.
   */
  protected lower(params: Parameters<typeof NewCRUDService.lower>): SQL {
    return NewCRUDService.lower(...params);
  }

  /**
   * Builds a search expression for a given word.
   * @param word The word to build the search expression for.
   * @returns The search expression.
   */
  private getSearchExpression(word: string): string {
    return `%${word.toLowerCase()}%`;
  }

  /**
   * Builds a search where clause for a given keyword.
   * @param keyword The keyword to search for.
   * @returns The search where clause.
   */
  private buildSearchWhereClause(keyword: string) {
    this.log.debug(
      `Building search where clause for '${keyword}' in ${this.tblName} including fields ${this.searchableFields.join(', ')}`,
    );

    const searchExpression = this.getSearchExpression(keyword);
    // FIXME: Improve typing of fields
    // @ts-expect-error
    return or(...this.searchableFields.map(field => like(this.lower(this.tbl[field]), searchExpression)));
  }

  /**
   * Creates new records in the table.
   * @param payload The data to insert into the table.
   * @returns The created records.
   */
  async create(payload: z.infer<typeof this.insertTblSchema>[]) {
    this.log.debug(`Creating %d records in %s`, payload.length, this.tblName);

    const schema = this.insertTblSchema;
    const parsedPayload = schema.safeParse(payload);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    const result = await this.db
      .insert(this.tbl)
      // FIXME: Improve typing
      // @ts-expect-error
      .values(parsedPayload.data)
      .returning();
    this.log.debug(`Created ${result.length} records in ${this.tblName}`);
    return result;
  }

  /**
   * Fetches all records from the table.
   * @returns An array of all records in the table.
   */
  getAll() {
    this.log.debug(`Fetching all records from ${this.tblName}`);
    // FIXME: Improve typing of this.tbl
    // @ts-expect-error
    return this.db.select().from(this.tbl);
  }

  /**
   * Fetches a record by ID.
   * @param entityId The ID of the record to fetch.
   * @returns The fetched record.
   */
  async getById(entityId: string | number) {
    this.log.debug(`Fetching record by ID from ${this.tblName}`);

    const result = await this.db
      .select()
      // FIXME: Improve typing of this.tbl
      // @ts-expect-error
      .from(this.tbl)
      // @ts-expect-error
      .where(eq(this.tbl.id, entityId));
    return result;
  }

  /**
   * Searches for records in the table based on a keyword.
   * @param keyword The keyword to search for.
   * @returns An array of matching records.
   */
  async search(keyword: string) {
    this.log.debug(`Searching in ${this.tblName} with keyword '${keyword}'`);
    const where = this.buildSearchWhereClause(keyword);

    // FIXME: Improve typing of this.tbl
    // @ts-expect-error
    const matches = await this.db.select().from(this.tbl).where(where);
    this.log.debug(`Found ${matches.length} matches in ${this.tblName} for keyword '${keyword}'`);

    return matches;
  }

  /**
   * Updates a record by ID.
   * @param entityId The ID of the record to update.
   * @param payload The data to update the record with.
   * @returns The updated record.
   */
  async updateById(entityId: string | number, payload: z.infer<typeof this.updateTblSchema>) {
    const updatedEntity = await this.db.transaction(async tx => {
      this.log.debug(`Updating record with ID ${entityId} in ${this.tblName}`);
      const result = await tx
        .update(this.tbl)
        .set(payload)
        // FIXME: Improve typing of this
        // @ts-expect-error
        .where(eq(this.tbl.id, entityId))
        .returning();

      if (!result || (Array.isArray(result) && result.length === 0)) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row updated in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row updated');
      }
    });

    return updatedEntity;
  }

  /**
   * Deletes a record by ID.
   * @param entityId The ID of the record to delete.
   * @returns The deleted record.
   */
  async deleteById(entityId: string | number) {
    this.log.debug(`Deleting record by ID from ${this.tblName}`);

    const result = await this.db
      .delete(this.tbl)
      // FIXME: Improve typing of this
      // @ts-expect-error
      .where(eq(this.tbl.id, entityId))
      .returning();

    return result;
  }
}
