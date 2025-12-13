"use client";

import {
	Box,
	Button,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import NextLink from "next/link";
import React from "react";
import { Card } from "@/components/Card";
import { PieChart, type PieChartData } from "@/components/Charts";
import { ErrorAlert as ErrorComp } from "@/components/ErrorAlert";
import { CircularProgress } from "@/components/Loading";
import { NoResults } from "@/components/NoResults";
import { RecurringPaymentService } from "@/services/RecurringPayment.service";
import type { TCategory, TExpandedRecurringPayment } from "@/types";
import { Formatter } from "@/utils/Formatter";

export type SubscriptionType = "INCOME" | "EXPENSE";

type CategoryStats = {
	category: Pick<TCategory, "id" | "name">;
	value: number;
};

const SUBSCRIPTION_TYPES: readonly SubscriptionType[] = [
	"INCOME",
	"EXPENSE",
] as const;

const SUBSCRIPTION_TYPE_META: Record<
	SubscriptionType,
	{ label: string; emptyText: string }
> = {
	INCOME: {
		label: "Income",
		emptyText: "No recurring income found!",
	},
	EXPENSE: {
		label: "Expenses",
		emptyText: "No recurring expenses found!",
	},
} as const;

type State<Key extends string | number | symbol> = {
	data: Partial<Record<Key, CategoryStats[]>>;
	isLoading: boolean;
	error: Error | null;
};

type Action =
	| { type: "start"; subscriptionType: SubscriptionType }
	| {
			type: "success";
			subscriptionType: SubscriptionType;
			payload: CategoryStats[];
	  }
	| { type: "error"; error: Error };

const initialState: State<SubscriptionType> = {
	data: {},
	isLoading: true,
	error: null,
};

function reducer(
	state: State<SubscriptionType>,
	action: Action,
): State<SubscriptionType> {
	switch (action.type) {
		case "start":
			return {
				...state,
				isLoading: true,
				error: null,
			};
		case "success":
			return {
				data: { ...state.data, [action.subscriptionType]: action.payload },
				isLoading: false,
				error: null,
			};
		case "error":
			return {
				...state,
				isLoading: false,
				error: action.error,
			};
		default:
			return state;
	}
}

export type SubscriptionPieChartProps = {
	withViewMore?: boolean;
};

export const SubscriptionPieChart: React.FC<SubscriptionPieChartProps> = ({
	withViewMore = false,
}) => {
	const [state, dispatch] = React.useReducer(reducer, initialState);
	const [subscriptionType, setSubscriptionType] =
		React.useState<SubscriptionType>("INCOME");

	const fetchData = React.useCallback(
		async (type: SubscriptionType) => {
			// Use cached data if available
			if (state.data[type]) return;

			dispatch({ type: "start", subscriptionType: type });

			try {
				const [subscriptionResponse, err] =
					await new RecurringPaymentService().getAll(undefined, {
						credentials: "include",
					});
				if (err) throw err;
				if (!subscriptionResponse) {
					throw new Error("No subscription data received");
				}
				const subscriptions = (subscriptionResponse.data ?? []).filter(
					(subscription) =>
						subscription.transferAmount >= 0 === (type === "INCOME"),
				);
				const categoryStats = groupSubscriptionsByCategory(subscriptions);
				dispatch({
					type: "success",
					subscriptionType: type,
					payload: categoryStats,
				});
			} catch (err) {
				dispatch({
					type: "error",
					error: err instanceof Error ? err : new Error(String(err)),
				});
			}
		},
		[state.data],
	);

	// Initial load + when default timeframe changes
	React.useEffect(() => {
		void fetchData(subscriptionType);
	}, [subscriptionType, fetchData]);

	const stats = state.data[subscriptionType];

	const chartData: PieChartData[] = React.useMemo(() => {
		return stats ? toPieData(stats) : [];
	}, [stats]);

	const totalValue = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
	}, [chartData]);

	const renderContent = () => {
		if (state.isLoading) return <CircularProgress />;
		if (state.error) return <ErrorComp error={state.error} />;
		if (chartData.length === 0)
			return (
				<NoResults text={SUBSCRIPTION_TYPE_META[subscriptionType].emptyText} />
			);

		return (
			<PieChart
				fullWidth
				primaryText={Formatter.currency.formatBalance(totalValue)}
				secondaryText={SUBSCRIPTION_TYPE_META[subscriptionType].label}
				series={[
					{
						data: chartData,
						valueFormatter: (value) =>
							Formatter.currency.formatBalance(value.value),
					},
				]}
			/>
		);
	};

	return (
		<Card>
			<Card.Header>
				<Box>
					<Card.Title>Recurring Payments</Card.Title>
					<Card.Subtitle>Monthly recurring payments</Card.Subtitle>
				</Box>
				<Card.HeaderActions sx={{ display: "flex", flexDirection: "row" }}>
					<ToggleButtonGroup
						size="small"
						color="primary"
						value={subscriptionType}
						onChange={(_, value: SubscriptionType) =>
							setSubscriptionType(value)
						}
						exclusive
					>
						{SUBSCRIPTION_TYPES.map((type) => {
							const meta = SUBSCRIPTION_TYPE_META[type];
							return (
								<ToggleButton key={type} value={type}>
									{meta.label}
								</ToggleButton>
							);
						})}
					</ToggleButtonGroup>
				</Card.HeaderActions>
			</Card.Header>
			<Card.Body sx={{ pt: 1 }}>{renderContent()}</Card.Body>
			{!state.isLoading && withViewMore && (
				<Card.Footer>
					<Stack direction="row" justifyContent="flex-end">
						<Button
							LinkComponent={NextLink}
							href="/subscriptions"
							aria-label="View more subscriptions"
						>
							View more...
						</Button>
					</Stack>
				</Card.Footer>
			)}
		</Card>
	);
};

function groupSubscriptionsByCategory(
	subscriptions: TExpandedRecurringPayment[],
): CategoryStats[] {
	const grouped = new Map<string, CategoryStats>();

	for (const subscription of subscriptions) {
		if (subscription.paused) continue;

		const absTransferAmount = Math.abs(subscription.transferAmount);
		const { id, name } = subscription.category;

		if (grouped.has(id)) {
			const existing = grouped.get(id) as CategoryStats;
			grouped.set(id, {
				category: existing.category,
				value: existing.value + absTransferAmount,
			});
		} else {
			grouped.set(id, {
				category: { id, name },
				value: absTransferAmount,
			});
		}
	}

	return Array.from(grouped.values());
}

function toPieData(stats: CategoryStats[]): PieChartData[] {
	return stats.map((stat) => ({
		label: stat.category.name,
		value: Math.abs(stat.value),
	}));
}
