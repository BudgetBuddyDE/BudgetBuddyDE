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
			<React.Suspense fallback={<div>Loading...</div>}>
				<DashboardStatsWrapper />
			</React.Suspense>

			<Grid size={{ xs: 12, md: 6, lg: 4 }} order={{ xs: 3, md: 1 }}>
				<Stack spacing={2}>
					<UpcomingSubscriptionsList />
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
					<LatestTransactionsList />
					<UpcomingTransactionsList />
				</Stack>
			</Grid>
		</React.Fragment>
	);
}
