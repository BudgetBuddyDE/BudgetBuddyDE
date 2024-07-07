import {PocketBaseCollection, type TNewsletter, type TServiceResponse, type TUser} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {WeeklyReport, type WeeklyReportProps} from '../../transactional/emails/app/weekly-report';
import {config} from '../config';
import {logger} from '../logger';
import {pb} from '../pocketbase';
import {resend} from '../resend';
import {retrieveTransactionReportData} from './retrieveTransactionReportData';

/**
 * Sends weekly reports to users subscribed to a newsletter.
 *
 * @param NEWSLETTER_ID - The ID of the newsletter.
 * @param startDate - The start date of the report period.
 * @param endDate - The end date of the report period.
 * @returns A promise that resolves to an array of weekly report data and an error, if any.
 */
export async function sendWeeklyReports(
  NEWSLETTER_ID: string,
  startDate: Date,
  endDate: Date,
): Promise<
  TServiceResponse<
    (Omit<WeeklyReportProps, 'name' | 'company' | 'startDate' | 'endDate'> & {user: NonNullable<TUser>})[]
  >
> {
  const newsletter = await pb.collection<TNewsletter>(PocketBaseCollection.NEWSLETTER).getOne(NEWSLETTER_ID);
  if (!newsletter.enabled) {
    return [null, new Error(`Newsletter ${NEWSLETTER_ID} is not enabled`)];
  }

  const users = (await pb.collection<TUser>(PocketBaseCollection.USERS).getFullList({requestKey: null})).filter(
    user => user && user.newsletter.length > 0 && user.newsletter.some(n => n === NEWSLETTER_ID),
  ) as TUser[];
  if (users.length === 0) {
    return [null, new Error('No users subscribed to this newsletter')];
  }
  const results = await Promise.all(
    users.map(user => retrieveTransactionReportData(user as NonNullable<TUser>, startDate, endDate)),
  );

  for (const {user, income, spendings, balance, grouped} of results) {
    // @ts-expect-error
    const response = await resend.emails.send({
      from: config.sender,
      to: user.email,
      subject: `Weekly Report ${format(startDate, 'dd-M M-yyyy')} - ${format(endDate, 'dd-MM-yyyy')}`,
      react: WeeklyReport({
        startDate: startDate,
        endDate: endDate,
        name: user.name ?? 'Buddy',
        company: config.company,
        income: income,
        spendings: spendings,
        balance: balance,
        grouped: grouped,
      }),
    });
    if (response.error) {
      logger.error(response.error);
      break;
    }
    logger.info(`Weekly report sent to ${user.email} via mail ${response.data?.id}`);
  }

  return [results, null];
}
