import {backendSchema} from './schema';
import {recurringPayments, transactions} from './tables';

export const transactionReceiverView = backendSchema.view('transaction_receiver_view').as(qb =>
  qb
    .selectDistinct({
      receiver: transactions.receiver,
      ownerId: transactions.ownerId,
    })
    .from(transactions)
    .unionAll(
      qb
        .selectDistinct({
          receiver: recurringPayments.receiver,
          ownerId: recurringPayments.ownerId,
        })
        .from(recurringPayments),
    ),
);
