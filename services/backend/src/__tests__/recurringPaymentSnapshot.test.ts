import {createPaymentSnapshot, hashPaymentSnapshot, parsePaymentSnapshot} from '../utils/recurringPaymentSnapshot';

const payment = {
  ownerId: 'owner',
  categoryId: '00000000-0000-4000-8000-000000000001',
  paymentMethodId: '00000000-0000-4000-8000-000000000002',
  receiver: 'Miete 🏠',
  transferAmount: -100,
  information: null,
};

it('serializes compact JSON without Base64 overhead and parses Unicode back', () => {
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
  expect(Buffer.byteLength(content, 'utf8')).toBeLessThan(Buffer.byteLength(Buffer.from(content).toString('base64')));
  expect(parsePaymentSnapshot(content)).toEqual({version: 1, ...payment, scheduledFor: '2026-10-14'});
});

it('rejects invalid snapshot JSON and invalid snapshot values', () => {
  expect(() => parsePaymentSnapshot('{')).toThrow();
  expect(() => parsePaymentSnapshot(JSON.stringify({version: 1, ...payment, scheduledFor: 'not-a-date'}))).toThrow();
});

it('preserves special characters and long information text', () => {
  const input = {...payment, information: 'Unicode \u00e4\u20ac "quoted"\n\\ '.repeat(1000)};
  const content = createPaymentSnapshot(input, '2026-10-14');
  expect(parsePaymentSnapshot(content)).toEqual({version: 1, ...input, scheduledFor: '2026-10-14'});
});

it('is deterministic regardless of input property order and ignores non-booking metadata', () => {
  const content = createPaymentSnapshot(payment, '2026-10-14');
  const {information, ...rest} = payment;
  const withMetadata = {information, ...rest, id: 'ignored'};
  expect(createPaymentSnapshot(withMetadata, '2026-10-14')).toBe(content);
  expect(hashPaymentSnapshot(content)).toMatch(/^[a-f0-9]{64}$/);
});

it.each(['receiver', 'transferAmount', 'categoryId', 'paymentMethodId', 'information'] as const)(
  'changes the content and fingerprint when %s changes',
  field => {
    const replacement = {
      receiver: 'Other',
      transferAmount: -120,
      categoryId: '00000000-0000-4000-8000-000000000003',
      paymentMethodId: '00000000-0000-4000-8000-000000000004',
      information: 'Changed',
    };
    const before = createPaymentSnapshot(payment, '2026-10-14');
    const after = createPaymentSnapshot({...payment, [field]: replacement[field]}, '2026-10-14');
    expect(after).not.toBe(before);
    expect(hashPaymentSnapshot(after)).not.toBe(hashPaymentSnapshot(before));
  },
);
