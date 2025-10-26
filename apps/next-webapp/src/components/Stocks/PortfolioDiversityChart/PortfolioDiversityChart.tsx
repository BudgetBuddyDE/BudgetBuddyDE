"use client";

import { Box } from "@mui/material";
import React from "react";

import { Card } from "@/components/Card";
import { PieChart, type PieChartData } from "@/components/Charts";
import { ErrorAlert } from "@/components/ErrorAlert";
import { CircularProgress } from "@/components/Loading";
import { NoResults } from "@/components/NoResults";
import { useFetch } from "@/hooks/useFetch";
import { AssetService } from "@/services/Stock";
import { Formatter } from "@/utils/Formatter";

// biome-ignore lint/complexity/noBannedTypes: No props needed (as of now)
export type PortfolioDiversityChartProps = {};

export const PortfolioDiversityChart: React.FC<
	PortfolioDiversityChartProps
> = () => {
	const fetchDataFunc = React.useCallback(async () => {
		const [allocations, err] =
			await AssetService.positions.getPositionAllocations();
		if (err) throw err;
		return allocations;
	}, []);
	const {
		isLoading,
		data: positionAllocations,
		error,
	} = useFetch(fetchDataFunc);

	const preparedData: PieChartData[] = React.useMemo(() => {
		if (!positionAllocations) return [];
		return positionAllocations.map(
			({ securityName, absolutePositionSize }) => ({
				label: securityName,
				value: absolutePositionSize,
			}),
		);
	}, [positionAllocations]);

	return (
		<Card>
			<Card.Header>
				<Box>
					<Card.Title>Positions</Card.Title>
					<Card.Subtitle>How are you positions allocated?</Card.Subtitle>
				</Box>
			</Card.Header>
			<Card.Body sx={{ pt: 1 }}>
				{isLoading && <CircularProgress />}

				{!isLoading && preparedData.length === 0 && (
					<NoResults text="No positions found!" />
				)}

				{!isLoading && error && <ErrorAlert error={error} />}

				{!isLoading && preparedData.length > 0 && (
					<PieChart
						fullWidth
						primaryText={Formatter.currency.formatBalance(
							preparedData.reduce((acc, curr) => acc + curr.value, 0),
						)}
						secondaryText="Total"
						series={[
							{
								data: preparedData.map((v) => ({
									value: v.value,
									label: v.label,
								})),
								valueFormatter: (value) =>
									Formatter.currency.formatBalance(value.value),
								innerRadius: 110,
								paddingAngle: 1,
								cornerRadius: 5,
								// REVISIT:
								// highlightScope: {faded: 'global', highlighted: 'item'},
							},
						]}
					/>
				)}
			</Card.Body>
		</Card>
	);
};
