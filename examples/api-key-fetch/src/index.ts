import {Api} from '@budgetbuddyde/api';

const apiKey = process.env.BUDGETBUDDY_API_KEY;
const backendUrl = process.env.BUDGETBUDDY_BACKEND_URL ?? 'http://localhost:9000';

if (!apiKey) {
  throw new Error('BUDGETBUDDY_API_KEY is required');
}

const requestConfig: RequestInit = {
  headers: {
    Accept: 'application/json',
    'x-api-key': apiKey,
  },
};

const api = new Api(backendUrl, requestConfig);

async function main() {
  const [categories, categoriesError] = await api.backend.category.getAll({from: 0, to: 5});

  if (categoriesError) {
    throw categoriesError;
  }

  const [transactions, transactionsError] = await api.backend.transaction.getAll({from: 0, to: 5});

  if (transactionsError) {
    throw transactionsError;
  }

  console.log('Fetched BudgetBuddyDE data with @budgetbuddyde/api');
  console.log(`Categories: ${categories.data?.length ?? 0}`);
  console.log(`Transactions: ${transactions.data?.length ?? 0}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
