import { PaymentMethodService } from "@/services/PaymentMethod.service";
import { createEntitySlice } from "../createEntitySlice";

export const paymentMethodSlice = createEntitySlice("paymentMethod", (query) =>
	PaymentMethodService.getPaymentMethodsWithCount(query),
);
