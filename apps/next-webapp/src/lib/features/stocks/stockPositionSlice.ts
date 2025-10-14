import { createEntitySlice } from '../createEntitySlice';
import { AssetService } from '@/services/Stock';

export const stockPositionSlice = createEntitySlice('stockPosition', (query) =>
  AssetService.positions.getWithCount(query)
);
