import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import KeyRounded from '@mui/icons-material/KeyRounded';
import LabelRounded from '@mui/icons-material/LabelRounded';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';
import ScheduleSendRounded from '@mui/icons-material/ScheduleSendRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import {describe, expect, it} from 'vitest';
import {ENTITY_ICONS} from './entityIcons';

describe('ENTITY_ICONS', () => {
  it('keeps one canonical icon for every supported entity', () => {
    expect(ENTITY_ICONS).toEqual({
      transaction: ReceiptRounded,
      recurringPayment: ScheduleSendRounded,
      paymentMethod: PaymentsRounded,
      category: LabelRounded,
      budget: TrendingUpRounded,
      attachment: AttachFileRounded,
      apiKey: KeyRounded,
    });
  });
});
