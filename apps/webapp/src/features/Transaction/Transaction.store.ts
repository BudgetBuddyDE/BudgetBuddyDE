import {type TTransaction} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';

import {TransactionService} from './TransactionService/Transaction.service';

export const useTransactionStore = GenerateGenericStore<TTransaction[]>(() => TransactionService.getTransactions());
