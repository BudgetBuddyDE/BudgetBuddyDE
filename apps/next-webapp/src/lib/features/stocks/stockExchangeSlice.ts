import { AssetService } from '@/services/Stock';
import { createEntitySlice } from '../createEntitySlice';

export const stockExchangeSlice = createEntitySlice('stockExchange', (query) =>
  AssetService.exchange.getWithCount(query)
);
