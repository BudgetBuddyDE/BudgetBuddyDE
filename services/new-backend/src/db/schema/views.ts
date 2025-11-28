import {sql} from 'drizzle-orm';
import {backendSchema} from './schema';
import {recurringPayments, stockPositions, transactions} from './tables';

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

export const stockPositionGroupedView = backendSchema.view('stock_position_grouped').as(qb =>
  qb
    .select({
      ownerId: stockPositions.ownerId,
      identifier: stockPositions.identifier,
      stockExchangeSymbol: stockPositions.stockExchangeSymbol,
      totalQuantity: sql`SUM(${stockPositions.quantity})`.as('total_quantity'),
      totalPurchasePrice: sql`SUM(${stockPositions.purchasePrice})`.as('total_purchase_price'),
      totalPurchaseFee: sql`SUM(${stockPositions.purchaseFee})`.as('total_purchase_fee'),
    })
    .from(stockPositions)
    .groupBy(stockPositions.ownerId, stockPositions.identifier, stockPositions.stockExchangeSymbol),
);
