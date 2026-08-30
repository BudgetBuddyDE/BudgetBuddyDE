/** biome-ignore-all lint/complexity/noStaticOnlyClass: This class is used as as a wrapper */

import {createNoopLogger, type Logger} from '@budgetbuddyde/logger';
import {ApplicationDataService} from './services/applicationData.service';
import {AttachmentService} from './services/attachment.service';
import {AuthDataExportService} from './services/authDataExport.service';
import {BudgetService} from './services/budget.service';
import {CategoryService} from './services/category.service';
import {InsightsService} from './services/insights.service';
import {PaymentMethodService} from './services/paymentMethod.service';
import {RecurringPaymentService} from './services/recurringPayment.service';
import {TransactionService} from './services/transaction.service';

export class Api {
  protected backendHost: string;
  public auth: {
    dataExport: AuthDataExportService;
  };
  public backend: {
    application: ApplicationDataService;
    attachment: AttachmentService;
    category: CategoryService;
    paymentMethod: PaymentMethodService;
    transaction: TransactionService;
    recurringPayment: RecurringPaymentService;
    budget: BudgetService;
    insights: InsightsService;
  };

  constructor(backendHost: string, authHost = backendHost, logger: Logger = createNoopLogger()) {
    this.backendHost = backendHost;
    this.auth = {
      dataExport: new AuthDataExportService(authHost, '/api', logger.child({module: 'AuthDataExportService'})),
    };
    this.backend = {
      application: new ApplicationDataService(
        backendHost,
        '/api/application',
        logger.child({module: 'ApplicationDataService'}),
      ),
      attachment: new AttachmentService(backendHost, '/api/attachment', logger.child({module: 'AttachmentService'})),
      category: new CategoryService(backendHost, '/api/category', logger.child({module: 'CategoryService'})),
      paymentMethod: new PaymentMethodService(
        backendHost,
        '/api/paymentMethod',
        logger.child({module: 'PaymentMethodService'}),
      ),
      transaction: new TransactionService(
        backendHost,
        '/api/transaction',
        logger.child({module: 'TransactionService'}),
      ),
      recurringPayment: new RecurringPaymentService(
        backendHost,
        '/api/recurringPayment',
        logger.child({module: 'RecurringPaymentService'}),
      ),
      budget: new BudgetService(backendHost, '/api/budget', logger.child({module: 'BudgetService'})),
      insights: new InsightsService(backendHost, logger.child({module: 'InsightsService'})),
    };
  }
}
