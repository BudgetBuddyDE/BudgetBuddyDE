import { AddRounded, BalanceRounded, RemoveRounded } from "@mui/icons-material";
import { Grid } from "@mui/material";
import {
	StatsCard,
	type TStatsCardProps,
} from "@/components/Analytics/StatsCard";
import { headers } from "@/lib/headers";
import { _BudgetService } from "@/services/Budget.service";
import { Formatter } from "@/utils/Formatter";

export const DashboardStatsWrapper = async () => {
	const [estimated, error] = await new _BudgetService().getEstimatedBudget({
		headers: await headers(),
	});
	if (error) throw error;

	const currentBalance = estimated.income.received - estimated.expenses.paid;
	const estimatedBalance =
		estimated.income.received +
		estimated.income.upcoming -
		(estimated.expenses.paid + estimated.expenses.upcoming);
	const stats: TStatsCardProps[] = [
		{
			icon: <AddRounded />,
			label: "Income",
			value: Formatter.currency.formatBalance(estimated.income.received),
			valueInformation: `Upcoming: ${Formatter.currency.formatBalance(estimated.income.upcoming)}`,
		},
		{
			icon: <RemoveRounded />,
			label: "Spendings",
			value: Formatter.currency.formatBalance(estimated.expenses.paid),
			valueInformation: `Upcoming: ${Formatter.currency.formatBalance(
				estimated.expenses.upcoming,
			)}`,
		},
		{
			icon: <BalanceRounded />,
			label: "Balance",
			value: Formatter.currency.formatBalance(currentBalance),
			valueInformation: `Estimated: ${Formatter.currency.formatBalance(
				estimatedBalance,
			)}`,
		},
	];

	return (
		<Grid container size={{ xs: 12 }} spacing={2}>
			{stats.map((props, idx, list) => (
				<Grid
					key={props.label.toString().toLowerCase().replace(" ", "_")}
					size={{ xs: idx === list.length - 1 ? 12 : 6, md: 4 }}
					sx={{ height: "unset" }}
				>
					<StatsCard isLoading={false} {...props} />
				</Grid>
			))}
		</Grid>
	);
};
