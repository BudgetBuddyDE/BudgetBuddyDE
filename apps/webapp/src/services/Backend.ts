/** biome-ignore-all lint/complexity/noStaticOnlyClass: This class is used as as a wrapper */

import { BudgetService } from "./Budget.service";
import { CategoryService } from "./Category.service";
import { PaymentMethodService } from "./PaymentMethod.service";
import { RecurringPaymentService } from "./RecurringPayment.service";
import { TransactionService } from "./Transaction.service";

export class Backend {
	static category = new CategoryService();
	static paymentMethod = new PaymentMethodService();
	static transaction = new TransactionService();
	static recurringPayment = new RecurringPaymentService();
	static budget = new BudgetService();
}
