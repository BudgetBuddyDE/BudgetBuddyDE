import {describe, expect, it} from 'vite-plus/test';
import {
  ApplicationImportResult,
  Attachment,
  Budget,
  CategoryStats,
  CreateOrUpdateBudgetPayload,
  CreateOrUpdatePaymentMethodPayload,
  CreateOrUpdateTransactionPayload,
  DeleteAttachmentsPayload,
  ExecutionPlan,
  GetAttachmentsQuery,
  MergeCategoriesResponse,
  MergePaymentMethodsResponse,
  PaymentMethod,
  RecurringPayment,
  RecurringPaymentOccurrence,
  SignedAttachmentUrlTTL,
  Transaction,
} from './index';

const uuid = '11111111-1111-4111-8111-111111111111';
const attachmentUuidV7 = '018f0f5e-5c00-7000-8000-000000000001';

describe('domain schemas', () => {
  it('validates budget type, amounts, names, descriptions and category IDs', () => {
    const payload = {type: 'i', name: 'Home', budget: 0, categories: [uuid]};
    expect(CreateOrUpdateBudgetPayload.safeParse(payload).success).toBe(true);
    expect(CreateOrUpdateBudgetPayload.safeParse({...payload, type: 'x'}).success).toBe(false);
    expect(CreateOrUpdateBudgetPayload.safeParse({...payload, budget: -1}).success).toBe(false);
    expect(CreateOrUpdateBudgetPayload.safeParse({...payload, name: ''}).success).toBe(false);
    expect(CreateOrUpdateBudgetPayload.safeParse({...payload, name: 'x'.repeat(41)}).success).toBe(false);
    expect(CreateOrUpdateBudgetPayload.safeParse({...payload, description: 'x'.repeat(201)}).success).toBe(false);
    expect(
      Budget.parse({
        ...payload,
        ownerId: 'user',
        id: uuid,
        balance: -5,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        categories: [],
      }).description,
    ).toBeNull();
  });

  it('validates payment method required fields and merge transformation', () => {
    expect(CreateOrUpdatePaymentMethodPayload.safeParse({name: 'Card', provider: 'Bank', address: '123'}).success).toBe(
      true,
    );
    expect(CreateOrUpdatePaymentMethodPayload.safeParse({name: 'Card', provider: '', address: '123'}).success).toBe(
      false,
    );
    expect(
      CreateOrUpdatePaymentMethodPayload.safeParse({name: 'Card', provider: 'x'.repeat(101), address: '123'}).success,
    ).toBe(false);
    expect(
      PaymentMethod.safeParse({
        id: uuid,
        ownerId: 'user',
        name: 'Card',
        provider: 'Bank',
        address: '123',
        description: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
    expect(
      MergePaymentMethodsResponse.parse({status: 200, data: {source: [uuid, uuid], target: uuid}}).data.source,
    ).toEqual(new Set([uuid]));
    expect(
      MergeCategoriesResponse.parse({status: 200, data: {source: [uuid, uuid], target: uuid}}).data.source,
    ).toEqual(new Set([uuid]));
  });

  it('coerces category statistics dates and rejects invalid dates', () => {
    const stats = {from: '2026-01-01', to: '2026-01-31', stats: []};
    expect(CategoryStats.parse(stats).from).toBeInstanceOf(Date);
    expect(CategoryStats.safeParse({...stats, from: 'not a date'}).success).toBe(false);
  });

  it('validates attachment TTL bounds, UUID version and deletion payload', () => {
    expect(SignedAttachmentUrlTTL.parse('60')).toBe(60);
    expect(SignedAttachmentUrlTTL.parse('3600')).toBe(3600);
    for (const value of ['59', '3601', 'nope']) expect(SignedAttachmentUrlTTL.safeParse(value).success).toBe(false);
    expect(GetAttachmentsQuery.parse({ttl: '900'}).ttl).toBe(900);
    expect(DeleteAttachmentsPayload.parse({}).attachmentIds).toBeUndefined();
    expect(DeleteAttachmentsPayload.safeParse({attachmentIds: ['not-a-uuid']}).success).toBe(false);
    expect(
      Attachment.safeParse({
        id: attachmentUuidV7,
        ownerId: 'user',
        fileName: 'a.png',
        fileExtension: 'png',
        contentType: 'image/png',
        location: 'a',
        createdAt: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
    expect(
      Attachment.safeParse({
        id: uuid,
        ownerId: 'user',
        fileName: 'a.png',
        fileExtension: 'png',
        contentType: 'image/png',
        location: 'a',
        createdAt: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(false);
    expect(
      Attachment.safeParse({
        id: attachmentUuidV7,
        ownerId: 'user',
        fileName: 'a.png',
        fileExtension: 'png',
        contentType: 'image/gif',
        location: 'a',
        createdAt: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(false);
  });

  it('validates transaction dates and optional information without constraining signed amounts', () => {
    const payload = {
      categoryId: uuid,
      paymentMethodId: uuid,
      processedAt: '2026-01-01T00:00:00Z',
      receiver: 'Shop',
      transferAmount: -10,
    };
    expect(CreateOrUpdateTransactionPayload.safeParse(payload).success).toBe(true);
    expect(CreateOrUpdateTransactionPayload.safeParse({...payload, processedAt: 'invalid'}).success).toBe(false);
    expect(CreateOrUpdateTransactionPayload.safeParse({...payload, information: null}).success).toBe(true);
    expect(
      Transaction.safeParse({
        ...payload,
        information: null,
        id: uuid,
        ownerId: 'user',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('defaults recurring payment paused and validates date-only schedules', () => {
    const payment = {
      id: uuid,
      ownerId: 'user',
      categoryId: uuid,
      paymentMethodId: uuid,
      processedAt: '2026-01-01T00:00:00Z',
      receiver: 'Rent',
      transferAmount: -10,
      information: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      executionPlan: 'monthly',
      startsOn: '2026-01-31',
    };
    expect(ExecutionPlan.options).toEqual(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']);
    expect(RecurringPayment.parse(payment).paused).toBe(false);
    expect(RecurringPayment.safeParse({...payment, startsOn: '2026-02-30'}).success).toBe(false);
    expect(RecurringPayment.safeParse({...payment, startsOn: '2026-01-01T00:00:00Z'}).success).toBe(false);
    const expandedPayment = {
      ...payment,
      paused: false,
      category: {
        id: uuid,
        ownerId: 'user',
        name: 'Home',
        description: null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      paymentMethod: {
        id: uuid,
        ownerId: 'user',
        name: 'Bank',
        provider: 'Bank',
        address: '123',
        description: null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    };
    expect(
      RecurringPaymentOccurrence.safeParse({scheduledFor: '2026-02-28', recurringPayment: expandedPayment}).success,
    ).toBe(true);
  });

  it('validates import resource results, row numbers and nonnegative summary counts', () => {
    const result = {
      mode: 'preview',
      preview: {
        categories: [{data: {name: 'Food', active: true, amount: 3, note: null}, row: 1}],
        'payment-methods': [],
        transactions: [],
        'recurring-payments': [],
        budgets: [],
      },
      resources: Object.fromEntries(
        ['categories', 'payment-methods', 'transactions', 'recurring-payments', 'budgets'].map(resource => [
          resource,
          {created: [], failed: [], skipped: []},
        ]),
      ),
      summary: {created: 0, failed: 0, received: 1, skipped: 0},
    };
    expect(ApplicationImportResult.safeParse(result).success).toBe(true);
    expect(ApplicationImportResult.safeParse({...result, summary: {...result.summary, failed: -1}}).success).toBe(
      false,
    );
    expect(
      ApplicationImportResult.safeParse({...result, preview: {categories: [{data: {nested: {bad: true}}, row: 1}]}})
        .success,
    ).toBe(false);
    expect(ApplicationImportResult.safeParse({...result, preview: {categories: [{data: {}, row: 0}]}}).success).toBe(
      false,
    );
    expect(ApplicationImportResult.safeParse({...result, preview: {attachments: []}}).success).toBe(false);
  });
});
