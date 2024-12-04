import {type TStockPositionWithQuote, type TUser} from '@budgetbuddyde/types';

import {logger} from '../logger';
import {StockService} from '../services';

/**
 * Retrieves stock report data for a user.
 *
 * @param user - The user for whom to retrieve the stock report data.
 * @returns A promise that resolves to an object containing the user and their stock positions.
 */
export async function retrieveStockReportData(
  user: NonNullable<TUser>,
): Promise<{user: NonNullable<TUser>; positions: TStockPositionWithQuote[]}> {
  logger.debug(`Retrieving stock positions for user ${user.id}`, {userId: user.id});

  const [stockPositions, err] = await StockService.getPositions(user.id);
  if (err) {
    logger.error(`Failed to retrieve stock positions for user ${user.id}`, {userId: user.id, error: err});
    return {user: user, positions: []};
  }

  return {user: user, positions: stockPositions};
}
