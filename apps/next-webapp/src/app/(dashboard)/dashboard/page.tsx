import { Grid, Stack } from "@mui/material";
import React from "react";
import { BudgetPieChart } from "@/components/Budget/BudgetPieChart";
import { CategoryExpenseChart } from "@/components/Category/CategoryPieChart";
import { UpcomingSubscriptionsList } from "@/components/Subscription/SubscriptionList";
import {
	LatestTransactionsList,
	UpcomingTransactionsList,
} from "@/components/Transaction/TransactionList";
import { DashboardStatsWrapper } from "./DashboardStatsWrapper";

export default function DashboardPage() {
	return (
		<React.Fragment>
			<React.Suspense fallback={<div>Retrieving dashboard stats...</div>}>
				<DashboardStatsWrapper />
			</React.Suspense>

			<Grid size={{ xs: 12, md: 6, lg: 4 }} order={{ xs: 3, md: 1 }}>
				<Stack spacing={2}>
					<React.Suspense
						fallback={<div>Fetching upcoming subscriptions...</div>}
					>
						<UpcomingSubscriptionsList />
					</React.Suspense>
				</Stack>
			</Grid>

			<Grid size={{ xs: 12, md: 6, lg: 4 }} order={{ xs: 1, md: 2 }}>
				<Stack spacing={2}>
					<CategoryExpenseChart />

					<BudgetPieChart />
				</Stack>
			</Grid>

			<Grid size={{ xs: 12, md: 6, lg: 4 }} order={{ xs: 2, md: 3 }}>
				<Stack spacing={2}>
					<React.Suspense fallback={<div>Fetching latest transactions...</div>}>
						<LatestTransactionsList />
					</React.Suspense>

					<React.Suspense
						fallback={<div>Fetching upcoming transactions...</div>}
					>
						<UpcomingTransactionsList />
					</React.Suspense>
				</Stack>
			</Grid>
		</React.Fragment>
	);
}
