"use client";

import { Grid } from "@mui/material";
import { ContentGrid } from "@/components/Layout/ContentGrid";
import { SubscriptionTable } from "@/components/Subscription/SubscriptionTable";

export default function SubscriptionsPage() {
	return (
		<ContentGrid title="Subscriptions">
			<Grid size="grow">
				<SubscriptionTable />
			</Grid>
		</ContentGrid>
	);
}
