import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {z} from 'zod';
import {registerAllTools} from './tools';

const mocks = vi.hoisted(() => {
  const crud = () => ({list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn()});
  return {
    category: crud(),
    paymentMethod: crud(),
    budget: crud(),
    transaction: {
      listTransactions: vi.fn(),
      getTransaction: vi.fn(),
      createTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      listTransactionAttachments: vi.fn(),
    },
    recurringPayment: {
      listRecurringPayments: vi.fn(),
      getRecurringPayment: vi.fn(),
      createRecurringPayment: vi.fn(),
      updateRecurringPayment: vi.fn(),
      removeRecurringPayment: vi.fn(),
      listRecurringPaymentOccurrences: vi.fn(),
    },
    attachment: {getAttachment: vi.fn()},
  };
});
vi.mock('../domain/category', () => mocks.category);
vi.mock('../domain/paymentMethod', () => mocks.paymentMethod);
vi.mock('../domain/budget', () => mocks.budget);
vi.mock('../domain/transaction', () => mocks.transaction);
vi.mock('../domain/recurringPayment', () => mocks.recurringPayment);
vi.mock('../domain/attachment', () => mocks.attachment);

const id = '019a1010-1111-7111-8111-111111111111';
const timestamp = '2026-10-05T10:00:00.000Z';
const category = {id, ownerId: 'owner-a', name: 'Food', description: null, createdAt: timestamp, updatedAt: timestamp};
const paymentMethod = {...category, provider: 'Bank', address: 'Account'};
const transaction = {
  id,
  ownerId: 'owner-a',
  categoryId: id,
  paymentMethodId: id,
  processedAt: timestamp,
  receiver: 'Market',
  transferAmount: -25,
  information: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const expandedTransaction = {
  id,
  ownerId: 'owner-a',
  processedAt: timestamp,
  receiver: 'Market',
  transferAmount: -25,
  information: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  category,
  paymentMethod,
};
const recurringPayment = {
  ...transaction,
  processedAt: undefined,
  executionPlan: 'monthly',
  startsOn: '2026-10-05',
  paused: false,
};
const expandedRecurringPayment = {
  ...expandedTransaction,
  processedAt: undefined,
  executionPlan: 'monthly',
  startsOn: '2026-10-05',
  paused: false,
};
const budget = {...category, type: 'e', budget: 100, balance: 75, categories: []};
const attachment = {
  id,
  ownerId: 'owner-a',
  fileName: 'receipt.png',
  fileExtension: 'png',
  contentType: 'image/png',
  location: 'receipts/receipt.png',
  createdAt: timestamp,
  signedUrl: 'https://storage.example.com/receipt.png',
};

interface ToolCase {
  name: string;
  operation: ReturnType<typeof vi.fn>;
  input: Record<string, unknown>;
  args: unknown[];
  data: unknown;
}
const cases: ToolCase[] = [];
function addCrud(
  singular: string,
  plural: string,
  operations: typeof mocks.category,
  payload: Record<string, unknown>,
  entity: unknown,
  expanded = entity,
  mutationData: unknown = [entity],
  deleteData: unknown = [entity],
): void {
  const query = {from: 0, to: 5};
  cases.push(
    {name: `list_${plural}`, operation: operations.list, input: query, args: [query], data: [expanded]},
    {name: `get_${singular}`, operation: operations.get, input: {id}, args: [id], data: expanded},
    {name: `create_${singular}`, operation: operations.create, input: payload, args: [payload], data: mutationData},
    {
      name: `update_${singular}`,
      operation: operations.update,
      input: {id, ...payload},
      args: [id, payload],
      data: mutationData,
    },
    {name: `delete_${singular}`, operation: operations.remove, input: {id}, args: [id], data: deleteData},
  );
}
addCrud('category', 'categories', mocks.category, {name: 'Food', description: null}, category);
addCrud(
  'payment_method',
  'payment_methods',
  mocks.paymentMethod,
  {name: 'Bank', provider: 'Bank', address: 'Account', description: null},
  paymentMethod,
);
addCrud(
  'budget',
  'budgets',
  mocks.budget,
  {name: 'Food', type: 'e', budget: 100, categories: [], description: null},
  budget,
  budget,
  budget,
  null,
);
addCrud(
  'transaction',
  'transactions',
  {
    list: mocks.transaction.listTransactions,
    get: mocks.transaction.getTransaction,
    create: mocks.transaction.createTransaction,
    update: mocks.transaction.updateTransaction,
    remove: mocks.transaction.removeTransaction,
  },
  {
    categoryId: id,
    paymentMethodId: id,
    processedAt: timestamp,
    receiver: 'Market',
    transferAmount: -25,
    information: null,
  },
  transaction,
  expandedTransaction,
);
cases.find(test => test.name === 'list_transactions')!.args = [
  {from: 0, to: 5, $dateFrom: undefined, $dateTo: undefined},
];
addCrud(
  'recurring_payment',
  'recurring_payments',
  {
    list: mocks.recurringPayment.listRecurringPayments,
    get: mocks.recurringPayment.getRecurringPayment,
    create: mocks.recurringPayment.createRecurringPayment,
    update: mocks.recurringPayment.updateRecurringPayment,
    remove: mocks.recurringPayment.removeRecurringPayment,
  },
  {
    categoryId: id,
    paymentMethodId: id,
    receiver: 'Rent',
    transferAmount: -25,
    information: null,
    executionPlan: 'monthly',
    startsOn: '2026-10-05',
    paused: false,
  },
  recurringPayment,
  expandedRecurringPayment,
);
cases.push(
  {
    name: 'list_recurring_payment_occurrences',
    operation: mocks.recurringPayment.listRecurringPaymentOccurrences,
    input: {dateFrom: '2026-10-01', dateTo: '2026-10-31', includePaused: true, from: 0, to: 5},
    args: [{$dateFrom: '2026-10-01', $dateTo: '2026-10-31', $includePaused: true, from: 0, to: 5}],
    data: [{scheduledFor: '2026-10-05', recurringPayment: expandedRecurringPayment}],
  },
  {
    name: 'get_attachment',
    operation: mocks.attachment.getAttachment,
    input: {id, ttl: 120},
    args: [id, {ttl: 120}],
    data: attachment,
  },
  {
    name: 'list_transaction_attachments',
    operation: mocks.transaction.listTransactionAttachments,
    input: {transactionId: id, from: 0, to: 5},
    args: [id, {from: 0, to: 5}],
    data: [attachment],
  },
);

interface RegisteredTool {
  config: {description: string; inputSchema: z.ZodType | z.ZodRawShape};
  callback: (input: Record<string, unknown>, extra: unknown) => Promise<CallToolResult>;
}
function register(userId: string): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();
  const registerTool = vi.fn((name: string, config: RegisteredTool['config'], callback: RegisteredTool['callback']) => {
    expect(tools.has(name)).toBe(false);
    tools.set(name, {config, callback});
  });
  registerAllTools({registerTool} as unknown as McpServer, userId);
  return tools;
}
function inputSchema(tool: RegisteredTool): z.ZodType {
  return tool.config.inputSchema instanceof z.ZodType ? tool.config.inputSchema : z.object(tool.config.inputSchema);
}
function response(data: unknown) {
  return {status: 200, message: 'Success', data, totalCount: 1, from: 'db'};
}
function text(result: CallToolResult): string {
  const content = result.content[0];
  expect(content.type).toBe('text');
  return (content as {type: 'text'; text: string}).text;
}

beforeEach(() => vi.resetAllMocks());

describe('integrated MCP tool contracts', () => {
  it('registers exactly the 28 public tool names without duplicates', () => {
    const tools = register('owner-a');
    expect(tools.size).toBe(28);
    expect([...tools.keys()].sort()).toEqual(cases.map(test => test.name).sort());
  });

  describe.each(cases)('$name', test => {
    it('exposes a serializable input schema and validates inputs before invocation', () => {
      const tool = register('owner-a').get(test.name)!;
      expect(tool.config.description).toBeTruthy();
      expect(z.toJSONSchema(inputSchema(tool)).type).toBe('object');
      expect(inputSchema(tool).safeParse(test.input).success).toBe(true);
      const invalid = {
        ...test.input,
        id: 'invalid-id',
        transactionId: 'invalid-id',
        name: 42,
        from: 'invalid-offset',
        dateFrom: 'invalid-date',
        transferAmount: 'invalid-amount',
      };
      expect(inputSchema(tool).safeParse(invalid).success).toBe(false);
      expect(test.operation).not.toHaveBeenCalled();
    });

    it('calls the local domain operation with owner context and preserves the public response', async () => {
      const tool = register('owner-a').get(test.name)!;
      test.operation.mockResolvedValue(response(test.data));
      const input = inputSchema(tool).parse(test.input) as Record<string, unknown>;
      const result = await tool.callback(input, {});
      expect(test.operation).toHaveBeenCalledExactlyOnceWith('owner-a', ...test.args);
      expect(result.isError).toBeUndefined();
      expect(JSON.parse(text(result))).toEqual(JSON.parse(JSON.stringify(response(test.data))));
    });

    it('keeps concurrent registrations bound to their own authenticated user', async () => {
      const first = register('owner-a').get(test.name)!;
      const second = register('owner-b').get(test.name)!;
      test.operation.mockResolvedValue(response(test.data));
      await Promise.all([first.callback(test.input, {}), second.callback(test.input, {})]);
      expect(test.operation).toHaveBeenNthCalledWith(1, 'owner-a', ...test.args);
      expect(test.operation).toHaveBeenNthCalledWith(2, 'owner-b', ...test.args);
    });

    it('returns an MCP error for unknown or foreign resources', async () => {
      test.operation.mockResolvedValue({status: 404, message: 'Not Found', data: null});
      const result = await register('owner-a').get(test.name)!.callback(test.input, {});
      expect(result.isError).toBe(true);
      expect(text(result)).toBe('Error: Not Found');
    });

    it('returns an MCP error when the domain operation throws', async () => {
      test.operation.mockRejectedValue(
        new Error('Database unavailable: postgresql://user:private-password@internal-db/account-data'),
      );
      const result = await register('owner-a').get(test.name)!.callback(test.input, {});
      expect(result.isError).toBe(true);
      expect(text(result)).toBe('Error: Internal Server Error');
      expect(JSON.stringify(result)).not.toContain('private-password');
      expect(JSON.stringify(result)).not.toContain('internal-db');
    });
  });

  it('converts transaction date filters before calling the shared service', async () => {
    mocks.transaction.listTransactions.mockResolvedValue(response([]));
    const result = await register('owner-a').get('list_transactions')!.callback(
      {
        search: 'Rent',
        $dateFrom: '2026-10-01',
        $dateTo: '2026-10-31',
      },
      {},
    );
    expect(result.isError).toBeUndefined();
    expect(mocks.transaction.listTransactions).toHaveBeenCalledWith('owner-a', {
      search: 'Rent',
      $dateFrom: new Date('2026-10-01'),
      $dateTo: new Date('2026-10-31'),
    });
  });

  it('returns an MCP error if a successful domain result violates its public response schema', async () => {
    mocks.category.get.mockResolvedValue(response({id: 'invalid'}));
    const result = await register('owner-a').get('get_category')!.callback({id}, {});
    expect(result.isError).toBe(true);
    expect(text(result)).toBe('Error: Bad Request');
    expect(JSON.stringify(result)).not.toContain('invalid');
  });

  it('uses a generic status message for unknown HTTP status codes', async () => {
    mocks.category.get.mockResolvedValue({status: 599, data: null});
    const result = await register('owner-a').get('get_category')!.callback({id}, {});
    expect(text(result)).toBe('Error: Request failed');
  });

  it('sanitizes non-Error domain failures using the MCP error convention', async () => {
    mocks.category.get.mockRejectedValue('Unexpected failure');
    const result = await register('owner-a').get('get_category')!.callback({id}, {});
    expect(text(result)).toBe('Error: Internal Server Error');
    expect(JSON.stringify(result)).not.toContain('Unexpected failure');
  });
});
