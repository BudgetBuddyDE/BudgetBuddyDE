import { createEntitySlice } from '../createEntitySlice';
import { StockExchangeService } from '@/services/Stock/StockExchange.service';

export const stockExchangeSlice = createEntitySlice('stockExchange', (query) =>
  StockExchangeService.getWithCount(query)
);
