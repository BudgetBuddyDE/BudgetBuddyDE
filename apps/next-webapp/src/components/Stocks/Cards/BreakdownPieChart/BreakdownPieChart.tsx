"use client";

import { Tab, Tabs } from "@mui/material";
import React from "react";
import { ActionPaper } from "@/components/ActionPaper";
import { Card } from "@/components/Card";
import { PieChart, type PieChartData } from "@/components/Charts";
import { NoResults } from "@/components/NoResults";
import type { TAsset } from "@/types";

export type BreakdownPieChartProps = {
	regions: TAsset["regions"];
	countries: TAsset["countries"];
	sectors: TAsset["sectors"];
	industries: TAsset["industries"];
};

const ButtonLabels: Record<keyof BreakdownPieChartProps, string> = {
	regions: "Regions",
	countries: "Countries",
	sectors: "Sectors",
	industries: "Industries",
};

export const BreakdownPieChart: React.FC<BreakdownPieChartProps> = (props) => {
	const [view, setView] = React.useState<keyof typeof props>("regions");
	const chartData: PieChartData[] = React.useMemo(
		() =>
			props[view].map((region) => ({
				label: region.name,
				value: region.share,
			})),
		[props, view],
	);
	return (
		<Card sx={{ p: 0 }}>
			<Card.Header>
				<Tabs
					value={view}
					onChange={(_, value) => setView(value)}
					variant="scrollable"
					scrollButtons={true}
					component={ActionPaper}
				>
					{Object.entries(ButtonLabels).map(([key, label]) => (
						<Tab key={key} label={label} value={key} />
					))}
				</Tabs>
			</Card.Header>
			<Card.Body sx={{ p: 2, pt: 1 }}>
				{chartData.length > 0 ? (
					<PieChart
						fullWidth
						series={[
							{
								data: chartData,
								valueFormatter: (value) => `${value.value.toFixed(2)}%`,
							},
						]}
					/>
				) : (
					<NoResults
						text={`There is no data for ${ButtonLabels[view]} available`}
					/>
				)}
			</Card.Body>
		</Card>
	);
};
