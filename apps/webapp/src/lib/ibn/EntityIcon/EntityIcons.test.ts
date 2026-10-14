import {
  SwapHorizRounded,
  AttachFileRounded,
  KeyRounded,
  LabelRounded,
  PaymentsRounded,
  RepeatRounded,
  TrendingUpRounded,
} from '@mui/icons-material';

import {describe, expect, it} from 'vitest';
import {ENTITY_ICONS} from './EntityIcon';

describe('ENTITY_ICONS', () => {
  it('keeps one canonical icon for every supported entity', () => {
    expect(ENTITY_ICONS).toEqual({
      transaction: SwapHorizRounded,
      recurringPayment: RepeatRounded,
      paymentMethod: PaymentsRounded,
      budget: TrendingUpRounded,
      category: LabelRounded,
      attachment: AttachFileRounded,
      apiKey: KeyRounded,
    });
  });
});
