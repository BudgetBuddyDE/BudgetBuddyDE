import {createPaymentSnapshot, parsePaymentSnapshot} from '../utils/recurringPaymentSnapshot';

const payment = {
  ownerId: 'owner',
  categoryId: '00000000-0000-4000-8000-000000000001',
  paymentMethodId: '00000000-0000-4000-8000-000000000002',
  receiver: 'Miete 🏠',
  transferAmount: -100,
  information: null,
};

it('serializes a compact, validated JSON snapshot and parses it back', () => {
  const content = createPaymentSnapshot(payment, '2026-10-14');

  expect(content).toBe(
    JSON.stringify({
      version: 1,
      ownerId: payment.ownerId,
      scheduledFor: '2026-10-14',
      categoryId: payment.categoryId,
      paymentMethodId: payment.paymentMethodId,
      receiver: payment.receiver,
      transferAmount: payment.transferAmount,
      information: payment.information,
    }),
  );
  expect(parsePaymentSnapshot(content)).toEqual({version: 1, ...payment, scheduledFor: '2026-10-14'});
});

it('rejects invalid snapshot JSON and invalid snapshot values', () => {
  expect(() => parsePaymentSnapshot('{')).toThrow();
  expect(() => parsePaymentSnapshot(JSON.stringify({version: 1, ...payment, scheduledFor: 'not-a-date'}))).toThrow();
});
