import {PocketBaseCollection, type TStockExchange, ZStockExchange} from '@budgetbuddyde/types';
import {z} from 'zod';

import {GenerateGenericStore} from '@/hooks/FETCH_HOOK/store';
import {pb} from '@/pocketbase';

import {type TStockExchangeAutocompleteOption} from './StockExchangeAutocomplete.component';

export const useStockExchangeStore = GenerateGenericStore<
  TStockExchange[],
  {selectOptions: TStockExchangeAutocompleteOption[]}
>(
  async () => {
    const records = await pb.collection(PocketBaseCollection.STOCK_EXCHANGE).getFullList();

    const parsingResult = z.array(ZStockExchange).safeParse(records);
    if (!parsingResult.success) {
      console.error(parsingResult.error);
      return [];
    }
    return parsingResult.data;
  },
  {selectOptions: []},
);
