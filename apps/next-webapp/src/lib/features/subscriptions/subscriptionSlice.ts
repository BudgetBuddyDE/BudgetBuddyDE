import { RecurringPaymentService } from "@/services/RecurringPayment.service";
import { createEntitySlice } from "../createEntitySlice";

export const subscriptionSlice = createEntitySlice("subscription", (query) =>
	new RecurringPaymentService().getAll(query),
);
