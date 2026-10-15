import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import * as authSchema from '@budgetbuddyde/db/auth';
import * as backendSchema from '@budgetbuddyde/db/backend';
import {eq, inArray} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {migrate} from 'drizzle-orm/node-postgres/migrator';
import {Pool} from 'pg';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';
import {executeScheduledRecurringPayment} from '../utils/executeScheduledRecurringPayment';
import {createPaymentSnapshot, hashPaymentSnapshot} from '../utils/recurringPaymentSnapshot';

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

  it('migrates existing JSON and null snapshots without losing execution records', async () => {
    const client = await pool.connect();
    const testSchema = `migration_${randomUUID().replaceAll('-', '')}`;
    try {
      await client.query('BEGIN');
      await client.query(`CREATE SCHEMA "${testSchema}";
        CREATE TABLE "${testSchema}".recurring_payment_execution (
          owner_id varchar NOT NULL, recurring_payment_id uuid NOT NULL, scheduled_for date NOT NULL,
          content text, CONSTRAINT recurring_payment_execution_pkey PRIMARY KEY(owner_id, recurring_payment_id, scheduled_for)
        )`);
      const snapshot = createPaymentSnapshot(
        {
          ownerId: 'migration-test',
          categoryId: randomUUID(),
          paymentMethodId: randomUUID(),
          receiver: 'Rent',
          transferAmount: -100,
          information: 'Unicode \u00e4\u20ac '.repeat(100),
        },
        scheduledFor,
      );
      await client.query(
        `INSERT INTO "${testSchema}".recurring_payment_execution VALUES ($1, $2, $3, $4), ($1, $5, $3, NULL)`,
        ['migration-test', randomUUID(), scheduledFor, snapshot, randomUUID()],
      );
      const migration = await readFile(
        resolve(__dirname, '../../../../packages/db/drizzle/0011_recurring_payment_content_identity.sql'),
        'utf8',
      );
      await client.query(migration.replaceAll('"budgetbuddy_backend"', `"${testSchema}"`));
      const {rows} = await client.query(
        `SELECT content, content_hash FROM "${testSchema}".recurring_payment_execution`,
      );
      expect(rows).toEqual(
        expect.arrayContaining([
          {
            content: Buffer.from(snapshot, 'utf8').toString('base64'),
            content_hash: hashPaymentSnapshot(Buffer.from(snapshot, 'utf8').toString('base64')),
          },
          {content: null, content_hash: ''},
        ]),
      );
      expect(rows).toHaveLength(2);
      const jsonMigration = await readFile(
        resolve(__dirname, '../../../../packages/db/drizzle/0012_recurring_payment_json_content.sql'),
        'utf8',
      );
      await client.query(jsonMigration.replaceAll('"budgetbuddy_backend"', `"${testSchema}"`));
      const converted = await client.query(
        `SELECT content, content_hash FROM "${testSchema}".recurring_payment_execution`,
      );
      expect(converted.rows).toEqual(
        expect.arrayContaining([
          {content: snapshot, content_hash: hashPaymentSnapshot(snapshot)},
          {content: null, content_hash: ''},
        ]),
      );
      expect(converted.rows).toHaveLength(2);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
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

  it('still skips previously booked content after migrating its Base64 snapshot to JSON', async () => {
    const payment = await createPayment();
    const result = await executeScheduledRecurringPayment(payment, scheduledFor, processedAt);
    if (result.status !== 'created') throw new Error('Expected a created booking');
    const content = Buffer.from(createPaymentSnapshot(payment, scheduledFor), 'utf8').toString('base64');
    await database
      .update(recurringPaymentExecutions)
      .set({content, contentHash: hashPaymentSnapshot(content)})
      .where(eq(recurringPaymentExecutions.ownerId, payment.ownerId));
    const migration = await readFile(
      resolve(__dirname, '../../../../packages/db/drizzle/0012_recurring_payment_json_content.sql'),
      'utf8',
    );
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
    const records = await recordsFor(payment.ownerId);
    expect(records.bookings).toHaveLength(1);
    expect(records.executions).toHaveLength(1);
    expect(records.executions[0]).toMatchObject({
      content: createPaymentSnapshot(payment, scheduledFor),
      contentHash: hashPaymentSnapshot(createPaymentSnapshot(payment, scheduledFor)),
      transactionId: result.transaction.id,
    });
    expect(
      (await executeScheduledRecurringPayment({...payment, transferAmount: -120}, scheduledFor, processedAt)).status,
    ).toBe('created');
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
  });

  it.each(['invalid-base64!', '/w=='])('aborts JSON migration on invalid stored encoding: %s', async invalidContent => {
    const client = await pool.connect();
    const testSchema = `migration_${randomUUID().replaceAll('-', '')}`;
    try {
      await client.query('BEGIN');
      await client.query(`CREATE SCHEMA "${testSchema}";
        CREATE TABLE "${testSchema}".recurring_payment_execution (content text, content_hash varchar(64))`);
      const validContent = Buffer.from('{"version":1}', 'utf8').toString('base64');
      await client.query(`INSERT INTO "${testSchema}".recurring_payment_execution VALUES ($1, $2), ($3, $4)`, [
        validContent,
        hashPaymentSnapshot(validContent),
        invalidContent,
        hashPaymentSnapshot(invalidContent),
      ]);
      await client.query('SAVEPOINT before_migration');
      const migration = await readFile(
        resolve(__dirname, '../../../../packages/db/drizzle/0012_recurring_payment_json_content.sql'),
        'utf8',
      );
      await expect(client.query(migration.replaceAll('"budgetbuddy_backend"', `"${testSchema}"`))).rejects.toThrow();
      await client.query('ROLLBACK TO SAVEPOINT before_migration');
      const {rows} = await client.query(
        `SELECT content, content_hash FROM "${testSchema}".recurring_payment_execution`,
      );
      expect(rows).toEqual([
        {content: validContent, content_hash: hashPaymentSnapshot(validContent)},
        {content: invalidContent, content_hash: hashPaymentSnapshot(invalidContent)},
      ]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('books changed content once and skips repeats including a return to earlier values', async () => {
    const payment = await createPayment();
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
    const [changedPayment] = await database
      .update(recurringPayments)
      .set({receiver: 'Changed receiver', transferAmount: -200})
      .where(eq(recurringPayments.id, payment.id))
      .returning();

    const results = await Promise.all(
      Array.from({length: 12}, () => executeScheduledRecurringPayment(changedPayment, scheduledFor, processedAt)),
    );
    expect(results.filter(result => result.status === 'created')).toHaveLength(1);
    expect(results.filter(result => result.status === 'skipped')).toHaveLength(11);
    expect(await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).toEqual({status: 'skipped'});
    const {bookings, executions} = await recordsFor(payment.ownerId);
    expect(bookings.map(booking => booking.transferAmount).sort()).toEqual([-100, -200]);
    expect(executions).toHaveLength(2);
    expect(
      executions.find(execution => execution.content === createPaymentSnapshot(payment, scheduledFor))?.transactionId,
    ).toBe(bookings.find(booking => booking.transferAmount === -100)?.id);
    expect(
      executions.find(execution => execution.content === createPaymentSnapshot(changedPayment, scheduledFor))
        ?.transactionId,
    ).toBe(bookings.find(booking => booking.transferAmount === -200)?.id);
  });

  it('keeps legacy executions without content protected even after payment changes', async () => {
    const payment = await createPayment();
    await database.insert(recurringPaymentExecutions).values({
      ownerId: payment.ownerId,
      recurringPaymentId: payment.id,
      scheduledFor,
      contentHash: '',
    });
    expect(
      await executeScheduledRecurringPayment({...payment, transferAmount: -200}, scheduledFor, processedAt),
    ).toEqual({status: 'skipped'});
    expect((await recordsFor(payment.ownerId)).bookings).toHaveLength(0);
  });

  it('supports long snapshot contents without exceeding PostgreSQL index limits', async () => {
    const payment = {...(await createPayment()), information: 'long payment information '.repeat(1000)};
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('created');
    expect((await executeScheduledRecurringPayment(payment, scheduledFor, processedAt)).status).toBe('skipped');
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
