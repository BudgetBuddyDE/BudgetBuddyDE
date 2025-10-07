import { StockPositionService } from '@/services/Stock/StockPosition.service';
import { createEntitySlice } from '../createEntitySlice';

export const stockPositionSlice = createEntitySlice('stockPosition', (query) =>
  StockPositionService.getWithCount(query)
);
