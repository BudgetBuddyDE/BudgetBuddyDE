import { SubscriptionService } from "@/services/Subscription.service";
import { createEntitySlice } from "../createEntitySlice";

export const subscriptionSlice = createEntitySlice("subscription", (query) =>
	SubscriptionService.getSubscriptionsWithCount(query),
);
