import { Backend } from "@/services/Backend";
import { createEntitySlice } from "../createEntitySlice";

export const subscriptionSlice = createEntitySlice("subscription", (query) =>
	Backend.recurringPayment.getAll(query),
);
