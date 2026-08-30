import type {Logger} from '@budgetbuddyde/logger';
import {describe, expect, it, vi} from 'vitest';
import {Api} from './api';

describe('Api', () => {
  it('injects child loggers into every API service', () => {
    const logger: Logger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    const child = vi.mocked(logger.child).mockReturnValue(logger);

    new Api('https://backend.example', 'https://auth.example', logger);

    expect(child).toHaveBeenCalledTimes(9);
    expect(child).toHaveBeenCalledWith({module: 'AuthDataExportService'});
    expect(child).toHaveBeenCalledWith({module: 'ApplicationDataService'});
    expect(child).toHaveBeenCalledWith({module: 'AttachmentService'});
    expect(child).toHaveBeenCalledWith({module: 'CategoryService'});
    expect(child).toHaveBeenCalledWith({module: 'PaymentMethodService'});
    expect(child).toHaveBeenCalledWith({module: 'TransactionService'});
    expect(child).toHaveBeenCalledWith({module: 'RecurringPaymentService'});
    expect(child).toHaveBeenCalledWith({module: 'BudgetService'});
    expect(child).toHaveBeenCalledWith({module: 'InsightsService'});
  });
});
