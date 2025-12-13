"use client";

import { Grid } from "@mui/material";
import { ContentGrid } from "@/components/Layout/ContentGrid";
import { RecurringPaymentTable } from "@/components/RecurringPayment/RecurringPaymentTable";

export default function RecurringPaymentsPage() {
	return (
		<ContentGrid title="Recurring Payments">
			<Grid size="grow">
				<RecurringPaymentTable />
			</Grid>
		</ContentGrid>
	);
}
