import {eq} from 'drizzle-orm';
import {db} from '../../db';
import {budgetCategories, budgets, categories, paymentMethods, recurringPayments, transactions} from '../../db/schema';

/**
 * Cleans up test data from the database
 * Use this in afterEach to ensure clean state between tests
 * Relies on cascade deletes for budgetCategories
 */
export async function cleanupTestData(userId?: string) {
  if (userId) {
    // Clean up data for a specific user in the correct order
    // Transactions and recurring payments first (they reference categories and payment methods)
    await db.delete(transactions).where(eq(transactions.ownerId, userId));
    await db.delete(recurringPayments).where(eq(recurringPayments.ownerId, userId));
    // Budgets (will cascade delete budgetCategories)
    await db.delete(budgets).where(eq(budgets.ownerId, userId));
    // Finally delete categories and payment methods
    await db.delete(categories).where(eq(categories.ownerId, userId));
    await db.delete(paymentMethods).where(eq(paymentMethods.ownerId, userId));
  } else {
    // Clean all test data (use with caution!)
    await db.delete(transactions);
    await db.delete(recurringPayments);
    await db.delete(budgets);
    await db.delete(categories);
    await db.delete(paymentMethods);
  }
}

/**
 * Creates test data fixtures for a user
 */
export async function createTestFixtures(userId: string) {
  // Create categories
  const [category1, category2] = await db
    .insert(categories)
    .values([
      {
        ownerId: userId,
        name: 'Groceries',
        description: 'Food and household items',
      },
      {
        ownerId: userId,
        name: 'Entertainment',
        description: 'Movies, games, etc.',
      },
    ])
    .returning();

  // Create payment methods
  const [paymentMethod1, paymentMethod2] = await db
    .insert(paymentMethods)
    .values([
      {
        ownerId: userId,
        name: 'Main Account',
        provider: 'Bank',
        address: 'DE89370400440532013000',
      },
      {
        ownerId: userId,
        name: 'Credit Card',
        provider: 'VISA',
        address: '1234567890123456',
      },
    ])
    .returning();

  // Create transactions
  const transactionList = await db
    .insert(transactions)
    .values([
      {
        ownerId: userId,
        categoryId: category1.id,
        paymentMethodId: paymentMethod1.id,
        processedAt: new Date('2024-01-15'),
        receiver: 'Supermarket',
        transferAmount: -50.0,
        information: 'Weekly groceries',
      },
      {
        ownerId: userId,
        categoryId: category2.id,
        paymentMethodId: paymentMethod2.id,
        processedAt: new Date('2024-01-20'),
        receiver: 'Cinema',
        transferAmount: -15.0,
        information: 'Movie tickets',
      },
    ])
    .returning();

  // Create a budget
  const [budget1] = await db
    .insert(budgets)
    .values([
      {
        ownerId: userId,
        type: 'e',
        name: 'Monthly Expenses',
        budget: 1000.0,
        description: 'Monthly expense budget',
      },
    ])
    .returning();

  // Link budget to categories
  await db.insert(budgetCategories).values([
    {
      budgetId: budget1.id,
      categoryId: category1.id,
    },
    {
      budgetId: budget1.id,
      categoryId: category2.id,
    },
  ]);

  return {
    categories: [category1, category2],
    paymentMethods: [paymentMethod1, paymentMethod2],
    transactions: transactionList,
    budgets: [budget1],
  };
}
