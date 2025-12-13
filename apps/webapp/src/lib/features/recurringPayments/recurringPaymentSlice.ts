import { Backend } from "@/services/Backend";
import { createEntitySlice } from "../createEntitySlice";

export const recurringPaymentSlice = createEntitySlice(
	"recurringPayment",
	(query) => Backend.recurringPayment.getAll(query),
);
