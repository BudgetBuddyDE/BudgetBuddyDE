import {PocketBaseCollection, type TNewsletter, type TServiceResponse, type TUser} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {MonthlyReport, type MonthlyReportProps} from '../../transactional/emails/app/monthly-report';
import {config} from '../config';
import {logger} from '../logger';
import {pb} from '../pocketbase';
import {resend} from '../resend';
import {retrieveTransactionReportData} from './retrieveTransactionReportData';

export async function sendMonthlyReports(
  NEWSLETTER_ID: string,
  month: Date,
  startDate: Date,
  endDate: Date,
): Promise<TServiceResponse<(Omit<MonthlyReportProps, 'name' | 'company' | 'month'> & {user: NonNullable<TUser>})[]>> {
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
      subject: `Monthly Report for ${format(month, 'MMMM yy')}`,
      react: MonthlyReport({
        month: month,
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
    logger.info(`Monthly report sent to ${user.email} via mail ${response.data?.id}`);
  }

  return [results, null];
}
