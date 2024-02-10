import {PoolClient} from 'pg';
import {type TUser, type TServiceResponse} from '@budgetbuddyde/types';
import pool from '../database';
import {
  type TClosePositionPayload,
  type TMaterializedStockPositionTable,
  type TOpenPositionPayload,
  type TStockPositionTable,
  type TUpdatePositionPayload,
} from '../types';

export class DatabaseService {
  /**
   * Retrieves stock positions by owner UUID.
   *
   * @param {Pick<TUser, 'uuid'>} params - The parameters for the query.
   * @returns {Promise<TServiceResponse<TMaterializedStockPositionTable[]>>} The result of the query.
   */
  static async getPositionsByOwner({
    uuid,
  }: Pick<TUser, 'uuid'>): Promise<TServiceResponse<TMaterializedStockPositionTable[]>> {
    let client;
    try {
      client = await pool.connect();
      const res = await client.query<TMaterializedStockPositionTable>(
        `SELECT
            position.id,
            position.owner,
            position.bought_at,
            json_build_object(
                'symbol', se.symbol,
                'name', se.name,
                'exchange', se.exchange,
                'country', se.country
            ) AS exchange,
            position.isin,
            position.buy_in,
            position.currency,
            position.quantity,
            position.created_at
        FROM public.stock_position position
        LEFT JOIN stock_exchange se on position.exchange = se.symbol
        WHERE owner = $1
        GROUP BY position.id, position.owner, position.bought_at, position.isin, position.buy_in, position.currency, position.quantity, position.created_at, se.symbol
        `,
        [uuid],
      );
      return [res.rows, null];
    } catch (error) {
      return [null, error as Error];
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Finds stock positions by their IDs and owner.
   *
   * @param positionIds - The IDs of the stock positions to find.
   * @param user - The user object representing the owner.
   * @returns A promise that resolves to a tuple containing an array of stock positions and an error, if any.
   */
  static async findByIdAndOwner(
    positionIds: TMaterializedStockPositionTable['id'][],
    user: TUser,
  ): Promise<TServiceResponse<TStockPositionTable[]>> {
    let client;
    try {
      if (positionIds.length === 0) return [null, new Error('No positions to select')];
      client = await pool.connect();
      const res = await client.query<TStockPositionTable>(
        `SELECT * FROM public.stock_position WHERE id = ANY($1) AND owner = $2`,
        [positionIds, user.uuid],
      );
      return [res.rows, null];
    } catch (error) {
      return [null, error as Error];
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Creates new stock positions in the database.
   *
   * @param positions - An array of open position payloads.
   * @returns A promise that resolves to a service response containing the materialized stock position table.
   */
  static async createPosition(
    positions: TOpenPositionPayload[],
  ): Promise<TServiceResponse<TMaterializedStockPositionTable[]>> {
    let client: PoolClient | null = null;
    try {
      if (positions.length === 0) return [null, new Error('No positions to insert')];
      client = await pool.connect();
      await client.query('BEGIN');
      const promises = positions.map(position => {
        return (client as PoolClient).query(
          `INSERT INTO 
        public.stock_position (owner, bought_at, exchange, isin, buy_in, currency, quantity) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            position.owner,
            position.bought_at,
            position.exchange,
            position.isin,
            position.buy_in,
            position.currency,
            position.quantity,
          ],
        );
      });
      await Promise.all(promises);
      await client.query('COMMIT');

      const [updatedList, error] = await this.getPositionsByOwner({uuid: positions[0].owner});
      if (error) return [null, error];
      return [updatedList, null];
    } catch (error) {
      return [null, error as Error];
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Updates the positions of stocks for a given user.
   *
   * @param positions - An array of position payloads to update.
   * @param user - The user for whom the positions are being updated.
   * @returns A promise that resolves to a tuple containing an array of materialized stock positions and an error, if any.
   */
  static async updatePosition(
    positions: TUpdatePositionPayload[],
    user: TUser,
  ): Promise<TServiceResponse<TMaterializedStockPositionTable[]>> {
    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const promises = positions.map(position => {
        const currency = 'EUR';
        return (client as PoolClient).query<TStockPositionTable>(
          `UPDATE public.stock_position 
          SET bought_at = $1, exchange = $2, isin = $3, buy_in = $4, currency = $5, quantity = $6
          WHERE id = $7 and owner = $8`,
          [
            position.bought_at,
            position.exchange,
            position.isin,
            position.buy_in,
            currency,
            position.quantity,
            position.id,
            user.uuid,
          ],
        );
      });
      await Promise.all(promises);
      await client.query('COMMIT');

      const [updatedList, error] = await this.getPositionsByOwner({uuid: user.uuid});
      if (error) return [null, error];
      return [updatedList, null];
    } catch (error) {
      if (client) client.query('ROLLBACK');
      return [null, error as Error];
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Deletes the specified positions from the stock_position table for the given user.
   *
   * @param positions - An array of positions to be deleted.
   * @param user - The user for whom the positions should be deleted.
   * @returns A promise that resolves to a tuple containing the deleted positions and any error that occurred during the deletion.
   */
  static async deletePositions(
    positions: TClosePositionPayload[],
    user: TUser,
  ): Promise<TServiceResponse<TStockPositionTable[]>> {
    let client;
    const ids = positions.map(({id}) => id);
    try {
      client = await pool.connect();
      const res = await client.query<TStockPositionTable>(
        `DELETE FROM public.stock_position WHERE id = ANY($1) AND owner = $2 RETURNING *`,
        [ids, user.uuid],
      );
      return [res.rows, null];
    } catch (error) {
      return [null, error as Error];
    } finally {
      if (client) client.release();
    }
  }
}
