/** biome-ignore-all lint/complexity/noStaticOnlyClass: This class is used as as a wrapper */

import { BudgetService } from "./services/budget.service";
import { CategoryService } from "./services/category.service";
import { PaymentMethodService } from "./services/paymentMethod.service";
import { RecurringPaymentService } from "./services/recurringPayment.service";
import { TransactionService } from "./services/transaction.service";

export class Api {
	protected backendHost: string;
	public backend: {
		category: CategoryService;
		paymentMethod: PaymentMethodService;
		transaction: TransactionService;
		recurringPayment: RecurringPaymentService;
		budget: BudgetService;
	};

	constructor(backendHost: string) {
		this.backendHost = backendHost;
		this.backend = {
			category: new CategoryService(backendHost),
			paymentMethod: new PaymentMethodService(backendHost),
			transaction: new TransactionService(backendHost),
			recurringPayment: new RecurringPaymentService(backendHost),
			budget: new BudgetService(backendHost),
		};
	}
}
