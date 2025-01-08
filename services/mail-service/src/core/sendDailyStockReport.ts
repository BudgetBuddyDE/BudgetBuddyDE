import {
  PocketBaseCollection,
  type TNewsletter,
  type TServiceResponse,
  type TStockPositionWithQuote,
  type TUser,
} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import DailyReport from '../../transactional/emails/stocks/daily-report';
import {config} from '../config';
import {logger as appLogger} from '../logger';
import {pb} from '../pocketbase';
import {resend} from '../resend';
import {StockService, type TMetalQuote} from '../services';
import {retrieveStockReportData} from './retrieveStockReportData';

/**
 * Sends the daily stock report to subscribed users.
 *
 * @param NEWSLETTER_ID - The ID of the newsletter.
 * @returns A tuple containing the stock report data and any error that occurred during the process.
 */
export async function sendDailyStockReport(
  NEWSLETTER_ID: string,
  logger = appLogger,
): Promise<
  TServiceResponse<{
    metals: TMetalQuote[];
    positions: {
      user: NonNullable<TUser>;
      positions: TStockPositionWithQuote[];
    }[];
  }>
> {
  const newsletter = await pb.collection<TNewsletter>(PocketBaseCollection.NEWSLETTER).getOne(NEWSLETTER_ID);
  if (!newsletter.enabled) {
    return [null, new Error(`Newsletter ${NEWSLETTER_ID} is not enabled`)];
  }

  const users = (
    (await pb.collection<TUser>(PocketBaseCollection.USERS).getFullList({requestKey: null})).filter(
      user => user && user.newsletter.length > 0 && user.newsletter.some(n => n === NEWSLETTER_ID),
    ) as TUser[]
  ).filter(user => user !== null);
  if (users.length === 0) {
    return [null, new Error('No users subscribed to this newsletter')];
  }

  const results = await Promise.all(users.map(user => retrieveStockReportData(user as NonNullable<TUser>)));
  const [metalQuotes, err] = await StockService.getMetalQuotes(users[0].id);
  if (err) return [null, err];

  for (const {user, positions} of results) {
    const response = await resend.emails.send({
      from: config.sender,
      to: user.email,
      subject: `Daily Stock Report ${format(new Date(), 'dd.MM.yyyy')}`,
      react: DailyReport({
        name: user.name ?? 'Buddy',
        company: config.company,
        day: new Date(),
        metals: metalQuotes,
        assets: positions,
      }),
    });
    if (response.error) {
      logger.debug(`Failed to send daily stock report to ${user.email}`, response.error);
      return [null, response.error];
    }
    logger.info(`Daily stock report report sent to ${user.email} via mail ${response.data?.id}`, {
      userId: user.id,
    });
  }

  return [
    {
      metals: metalQuotes,
      positions: results,
    },
    null,
  ];
}
