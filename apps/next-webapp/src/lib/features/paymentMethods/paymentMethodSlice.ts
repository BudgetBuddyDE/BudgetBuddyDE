import { NewPaymentMethodService } from "@/services/PaymentMethod.service";
import { createEntitySlice } from "../createEntitySlice";

export const paymentMethodSlice = createEntitySlice("paymentMethod", (query) =>
	new NewPaymentMethodService().getAll(query),
);
