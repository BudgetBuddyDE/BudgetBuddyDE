import { Backend } from "@/services/Backend";
import { createEntitySlice } from "../createEntitySlice";

export const paymentMethodSlice = createEntitySlice("paymentMethod", (query) =>
	Backend.paymentMethod.getAll(query),
);
