import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TExpandedTransaction} from '@/newTypes';

import {TransactionService} from './TransactionService/Transaction.service';

export type TTransactionStoreFetchArgs = {
  startDate: Date;
  endDate: Date;
};

export const useTransactionStore = GenerateGenericStore<TExpandedTransaction[], {}, TTransactionStoreFetchArgs>(
  _args => {
    // return TransactionService.getTransactions(args);
    return TransactionService.getTransactions();
  },
);
