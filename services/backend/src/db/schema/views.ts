import {sql} from 'drizzle-orm';
import {backendSchema} from './schema';
import {recurringPayments, transactions} from './tables';

export const transactionReceiverView = backendSchema.view('transaction_receiver_view').as(qb =>
  qb
    .selectDistinct({
      receiver: sql<string>`TRIM(${transactions.receiver})`.as('receiver'),
      ownerId: transactions.ownerId,
    })
    .from(transactions)
    .union(
      qb
        .selectDistinct({
          receiver: sql<string>`TRIM(${recurringPayments.receiver})`.as('receiver'),
          ownerId: recurringPayments.ownerId,
        })
        .from(recurringPayments),
    ),
);
