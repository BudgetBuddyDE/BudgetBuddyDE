import type {Logger} from '@budgetbuddyde/logger';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {Api} from './api';

describe('Api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the backend URL for integrated authentication exports', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('archive'));
    vi.stubGlobal('fetch', fetchMock);

    const [archive, error] = await new Api('https://backend.example').auth.dataExport.exportArchive('json');

    expect(error).toBeNull();
    await expect(archive?.text()).resolves.toBe('archive');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example/api/auth/export?format=json',
      expect.objectContaining({credentials: 'include', cache: 'no-store'}),
    );
  });

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

    new Api('https://backend.example', logger);

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
