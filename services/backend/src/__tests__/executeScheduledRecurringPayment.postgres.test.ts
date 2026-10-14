import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import * as authSchema from '@budgetbuddyde/db/auth';
import * as backendSchema from '@budgetbuddyde/db/backend';
import {eq, inArray} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
import {Pool} from 'pg';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';
import {executeScheduledRecurringPayment} from '../utils/executeScheduledRecurringPayment';

const schema = {...authSchema, ...backendSchema};
let database: ReturnType<typeof drizzle<typeof schema>>;
let pool: Pool;

// Use the real service functions, but never the application's configured database.
vi.mock('../db', () => ({
  get db() {
    return database;
  },
}));

const connectionString = process.env.RECURRING_PAYMENT_TEST_DATABASE_URL;
const {user} = authSchema;
const {categories, paymentMethods, recurringPayments, recurringPaymentExecutions, transactions} = backendSchema;
const scheduledFor = '2026-10-14';
const processedAt = new Date('2026-10-14T01:30:00Z');
let ownerIds: string[] = [];

async function createPayment() {
  const ownerId = `recurring-test-${randomUUID()}`;
  ownerIds.push(ownerId);
  await database.insert(user).values({id: ownerId, name: 'Recurring test', email: `${ownerId}@example.test`});
  const [category] = await database.insert(categories).values({ownerId, name: 'Rent'}).returning();
  const [paymentMethod] = await database
    .insert(paymentMethods)
    .values({ownerId, name: 'Bank', provider: 'Test', address: 'Test account'})
    .returning();
  const [payment] = await database
    .insert(recurringPayments)
    .values({
      ownerId,
      categoryId: category.id,
      paymentMethodId: paymentMethod.id,
      receiver: 'Rent',
      transferAmount: -100,
      startsOn: scheduledFor,
      executionPlan: 'daily',
    })
    .returning();
  return payment;
}

async function recordsFor(ownerId: string) {
  const [bookings, executions] = await Promise.all([
    database.select().from(transactions).where(eq(transactions.ownerId, ownerId)),
    database.select().from(recurringPaymentExecutions).where(eq(recurringPaymentExecutions.ownerId, ownerId)),
  ]);
  return {bookings, executions};
}

describe.skipIf(!connectionString)('scheduled recurring payments against PostgreSQL', () => {
  beforeAll(async () => {
    const databaseName = new URL(connectionString!).pathname.slice(1);
    if (!/^budgetbuddy_test_[a-z0-9_]+$/.test(databaseName)) {
      throw new Error('PostgreSQL tests require a dedicated database named budgetbuddy_test_*');
    }
    pool = new Pool({connectionString, max: 12, connectionTimeoutMillis: 5000});
    const {rows} = await pool.query<{name: string}>('SELECT current_database() AS name');
    if (rows[0].name !== databaseName) throw new Error('Connected database does not match the dedicated test database');
    database = drizzle(pool, {schema});
    await migrate(database, {migrationsFolder: resolve(__dirname, '../../../../packages/db/drizzle')});
  }, 30_000);

  afterEach(async () => {
    if (database && ownerIds.length > 0) await database.delete(user).where(inArray(user.id, ownerIds));
    ownerIds = [];
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it('commits exactly one booking and execution across competing database connections', async () => {
    const payment = await createPayment();
    const results = await Promise.all(
      Array.from({length: 12}, () => executeScheduledRecurringPayment(payment, scheduledFor, processedAt)),
    );

    expect(results.filter(result => result.status === 'created')).toHaveLength(1);
    expect(results.filter(result => result.status === 'skipped')).toHaveLength(11);
    const {bookings, executions} = await recordsFor(payment.ownerId);
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({
      ownerId: payment.ownerId,
      receiver: payment.receiver,
      transferAmount: payment.transferAmount,
      categoryId: payment.categoryId,
      paymentMethodId: payment.paymentMethodId,
    });
    expect(executions).toHaveLength(1);
    expect(executions[0]).toMatchObject({scheduledFor, transactionId: bookings[0].id});
  });

  it('skips repeated attempts, changed data, and a retry after an uncertain commit response', async () => {
    const payment = await createPayment();
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
    const [changedPayment] = await database
      .update(recurringPayments)
      .set({receiver: 'Changed receiver', transferAmount: -200})
      .where(eq(recurringPayments.id, payment.id))
      .returning();

    expect(await executeScheduledRecurringPayment(changedPayment, scheduledFor, processedAt)).toEqual({
      status: 'skipped',
    });
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
    const {bookings} = await recordsFor(payment.ownerId);
    expect(bookings).toHaveLength(1);
    expect(bookings[0].transferAmount).toBe(-100);
  });

  it('keeps identical schedules and different occurrence dates independent', async () => {
    const payment = await createPayment();
    const [otherPayment] = await database
      .insert(recurringPayments)
      .values({...payment, id: randomUUID()})
      .returning();

    const results = await Promise.all([
      executeScheduledRecurringPayment(payment, scheduledFor, processedAt),
      executeScheduledRecurringPayment(otherPayment, scheduledFor, processedAt),
      executeScheduledRecurringPayment(payment, '2026-10-15', new Date('2026-10-15T01:30:00Z')),
    ]);

    expect(results.every(result => result.status === 'created')).toBe(true);
    const {bookings, executions} = await recordsFor(payment.ownerId);
    expect(bookings).toHaveLength(3);
    expect(executions).toHaveLength(3);
  });

  it('rolls back a reservation on failed booking and allows a later attempt', async () => {
    const payment = await createPayment();
    await expect(
      executeScheduledRecurringPayment({...payment, categoryId: randomUUID()}, scheduledFor, processedAt),
    ).rejects.toThrow();

    expect(await recordsFor(payment.ownerId)).toEqual({bookings: [], executions: []});
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
  });

  it('rolls back both writes when linking the booking fails', async () => {
    const payment = await createPayment();
    // A real SQL failure after the transaction insert proves rollback of both persisted writes.
    await pool.query(`
      CREATE FUNCTION budgetbuddy_backend.test_reject_execution_link() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test execution link failure'; END; $$;
      CREATE TRIGGER test_reject_execution_link BEFORE UPDATE ON budgetbuddy_backend.recurring_payment_execution
      FOR EACH ROW EXECUTE FUNCTION budgetbuddy_backend.test_reject_execution_link();
    `);
    try {
      await expect(executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).rejects.toThrow();
      expect(await recordsFor(payment.ownerId)).toEqual({bookings: [], executions: []});
    } finally {
      await pool.query(`
        DROP TRIGGER test_reject_execution_link ON budgetbuddy_backend.recurring_payment_execution;
        DROP FUNCTION budgetbuddy_backend.test_reject_execution_link();
      `);
    }
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
  });

  it('retains the execution after editing or deleting the generated transaction', async () => {
    const payment = await createPayment();
    const result = await executeScheduledRecurringPayment(payment, scheduledFor, processedAt);
    if (result.status !== 'created') throw new Error('Expected a created booking');

    await database.update(transactions).set({transferAmount: -50}).where(eq(transactions.id, result.transaction.id));
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
    await database.delete(transactions).where(eq(transactions.id, result.transaction.id));
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});

    const {bookings, executions} = await recordsFor(payment.ownerId);
    expect(bookings).toHaveLength(0);
    expect(executions).toHaveLength(1);
    expect(executions[0].transactionId).toBeNull();
  });

  it('retains protection after deleting and restoring the same schedule ID', async () => {
    const payment = await createPayment();
    await executeScheduledRecurringPayment(payment, scheduledFor, processedAt);
    await database.delete(recurringPayments).where(eq(recurringPayments.id, payment.id));
    expect((await recordsFor(payment.ownerId)).bookings).toHaveLength(1);
    await database.insert(recurringPayments).values(payment);

    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
    const [newPayment] = await database
      .insert(recurringPayments)
      .values({...payment, id: randomUUID()})
      .returning();
    expect((await executeScheduledRecurringPayment(newPayment, scheduledFor, processedAt)).status).toBe('created');
  });

  it('isolates owner identities and deletes only the removed account execution history', async () => {
    const first = await createPayment();
    const second = await createPayment();
    // Simulate a previously deleted/reimported ID under a different account.
    await executeScheduledRecurringPayment(first, scheduledFor, processedAt);
    await executeScheduledRecurringPayment({...second, id: first.id}, scheduledFor, processedAt);
    expect((await recordsFor(second.ownerId)).executions).toHaveLength(1);

    await database.delete(user).where(eq(user.id, first.ownerId));
    expect(await recordsFor(first.ownerId)).toEqual({bookings: [], executions: []});
    expect((await recordsFor(second.ownerId)).executions).toHaveLength(1);
  });

  it('keeps manual extra bookings independent before and after automatic execution', async () => {
    const payment = await createPayment();
    await createTransactionFromRecurringPayment(payment, processedAt);
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
    await createTransactionFromRecurringPayment(payment, processedAt);
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});

    const {bookings, executions} = await recordsFor(payment.ownerId);
    expect(bookings).toHaveLength(3);
    expect(executions).toHaveLength(1);
  });
});
