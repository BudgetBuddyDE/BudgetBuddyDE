import {transactions} from '@budgetbuddyde/db/backend';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';
const {insert, values, returning} = vi.hoisted(() => ({insert: vi.fn(), values: vi.fn(), returning: vi.fn()}));
vi.mock('../db', () => ({db: {insert}}));
beforeEach(() => {
  vi.resetAllMocks();
  insert.mockReturnValue({values});
  values.mockReturnValue({returning});
  returning.mockResolvedValue([{id: 'created'}]);
});
afterEach(() => vi.useRealTimers());
const payment = {
  ownerId: 'owner',
  categoryId: 'category',
  paymentMethodId: 'payment',
  receiver: 'Rent',
  information: null,
  transferAmount: -100,
};
it('creates one transaction preserving owner, references, signed amount and execution date', async () => {
  const date = new Date('2026-01-01');
  expect(await createTransactionFromRecurringPayment(payment, date)).toEqual({id: 'created'});
  expect(insert).toHaveBeenCalledWith(transactions);
  expect(values).toHaveBeenCalledWith({...payment, processedAt: date});
});
it('defaults processing time to now', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-02-01'));
  await createTransactionFromRecurringPayment(payment);
  expect(values).toHaveBeenCalledWith({...payment, processedAt: new Date('2026-02-01')});
});
it('propagates database failure', async () => {
  returning.mockRejectedValueOnce(new Error('database failure'));
  await expect(createTransactionFromRecurringPayment(payment)).rejects.toThrow('database failure');
});
