/** biome-ignore-all lint/complexity/noStaticOnlyClass: This class is used as as a wrapper */

import {AttachmentService} from './services/attachment.service';
import {BudgetService} from './services/budget.service';
import {CategoryService} from './services/category.service';
import {InsightsService} from './services/insights.service';
import {PaymentMethodService} from './services/paymentMethod.service';
import {RecurringPaymentService} from './services/recurringPayment.service';
import {TransactionService} from './services/transaction.service';

export class Api {
  protected backendHost: string;
  public backend: {
    attachment: AttachmentService;
    category: CategoryService;
    paymentMethod: PaymentMethodService;
    transaction: TransactionService;
    recurringPayment: RecurringPaymentService;
    budget: BudgetService;
    insights: InsightsService;
  };

  constructor(backendHost: string, requestConfig?: RequestInit) {
    this.backendHost = backendHost;
    this.backend = {
      attachment: new AttachmentService(backendHost, '/api/attachment', requestConfig),
      category: new CategoryService(backendHost, '/api/category', requestConfig),
      paymentMethod: new PaymentMethodService(backendHost, '/api/paymentMethod', requestConfig),
      transaction: new TransactionService(backendHost, '/api/transaction', requestConfig),
      recurringPayment: new RecurringPaymentService(backendHost, '/api/recurringPayment', requestConfig),
      budget: new BudgetService(backendHost, '/api/budget', requestConfig),
      insights: new InsightsService(backendHost, requestConfig),
    };
  }
}
