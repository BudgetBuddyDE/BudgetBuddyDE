import {recurringPaymentExecutions, transactions} from '@budgetbuddyde/db/backend';
import {executeScheduledRecurringPayment} from '../utils/executeScheduledRecurringPayment';

const {transaction, insert, update, reservationReturning, transactionReturning, executionReturning, values, set} =
  vi.hoisted(() => ({
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    reservationReturning: vi.fn(),
    transactionReturning: vi.fn(),
    executionReturning: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
  }));

vi.mock('../db', () => ({db: {transaction}}));

const payment = {
  id: '00000000-0000-4000-8000-000000000001',
  ownerId: 'owner',
  categoryId: '00000000-0000-4000-8000-000000000002',
  paymentMethodId: '00000000-0000-4000-8000-000000000003',
  receiver: 'Rent',
  information: null,
  transferAmount: -100,
};
const processedAt = new Date('2026-10-14T01:30:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation(callback => callback({insert, update}));
  insert.mockImplementation(table => ({
    values: (input: unknown) => {
      values(input);
      return table === recurringPaymentExecutions
        ? {onConflictDoNothing: () => ({returning: reservationReturning})}
        : {returning: transactionReturning};
    },
  }));
  update.mockReturnValue({
    set: (input: unknown) => {
      set(input);
      return {where: () => ({returning: executionReturning})};
    },
  });
  reservationReturning.mockResolvedValue([{scheduledFor: '2026-10-14'}]);
  transactionReturning.mockResolvedValue([{id: 'created', ownerId: payment.ownerId}]);
  executionReturning.mockResolvedValue([{transactionId: 'created'}]);
});

it('reserves and links an occurrence in the same transaction with the original payment data', async () => {
  const result = await executeScheduledRecurringPayment(payment, '2026-10-14', processedAt);

  expect(result).toEqual({status: 'created', transaction: {id: 'created', ownerId: 'owner'}});
  expect(transaction).toHaveBeenCalledTimes(1);
  expect(values).toHaveBeenNthCalledWith(1, {
    ownerId: payment.ownerId,
    recurringPaymentId: payment.id,
    scheduledFor: '2026-10-14',
  });
  const {id: _id, ...transactionData} = payment;
  expect(values).toHaveBeenNthCalledWith(2, {...transactionData, processedAt});
  expect(insert).toHaveBeenNthCalledWith(2, transactions);
  expect(set).toHaveBeenCalledWith({transactionId: 'created'});
});

it('skips a reserved occurrence without inserting a transaction or updating its link', async () => {
  reservationReturning.mockResolvedValue([]);

  expect(await executeScheduledRecurringPayment(payment, '2026-10-14', processedAt)).toEqual({status: 'skipped'});
  expect(insert).toHaveBeenCalledTimes(1);
  expect(update).not.toHaveBeenCalled();
});

it.each(['reservation', 'transaction', 'link'])('propagates a %s failure for transaction rollback', async stage => {
  const returning = {reservation: reservationReturning, transaction: transactionReturning, link: executionReturning};
  returning[stage as keyof typeof returning].mockRejectedValueOnce(new Error('database failure'));

  await expect(executeScheduledRecurringPayment(payment, '2026-10-14', processedAt)).rejects.toThrow(
    'database failure',
  );
});

it('rejects an empty transaction insert result rather than committing a reservation', async () => {
  transactionReturning.mockResolvedValue([]);

  await expect(executeScheduledRecurringPayment(payment, '2026-10-14', processedAt)).rejects.toThrow(
    'No transaction created',
  );
  expect(update).not.toHaveBeenCalled();
});

it('rejects a missing execution link rather than committing a partial write', async () => {
  executionReturning.mockResolvedValue([]);

  await expect(executeScheduledRecurringPayment(payment, '2026-10-14', processedAt)).rejects.toThrow(
    'No execution linked',
  );
});
