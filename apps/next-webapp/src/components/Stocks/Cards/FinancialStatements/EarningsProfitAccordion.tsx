"use client";

import { ExpandMoreRounded } from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Divider,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	Typography,
} from "@mui/material";
import React from "react";
import { BarChart } from "@/components/Charts";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Formatter } from "@/utils/Formatter";
import type { FinancialStatementsProps } from "./FinancialStatements";

export type EarningsProfitAccordionProps = Pick<
	FinancialStatementsProps,
	"currency" | "financials"
>;

export const EarningsProfitAccordion: React.FC<
	EarningsProfitAccordionProps
> = ({ financials }) => {
	const screenSize = useScreenSize();
	const [currentTab, setCurrentTab] = React.useState<"quarterly" | "annual">(
		"annual",
	);
	const chartData = React.useMemo(() => {
		return financials[currentTab];
	}, [financials, currentTab]);
	const tableData = React.useMemo(() => {
		if (chartData.length < 2) {
			return { labels: [], data: [] };
		}
		// Get last two entries, as they will be the latest ones
		const data = chartData.slice(0, 2);
		return {
			labels: data.map(({ date }) => Formatter.date.format(date)).reverse(),
			data: [
				{
					label: "Revenue",
					prevValue: data[1].revenue,
					latestValue: data[0].revenue,
				},
				{
					label: "Net Profit",
					prevValue: data[1].netIncome,
					latestValue: data[0].netIncome,
				},
			],
		};
	}, [chartData]);

	const seriesFormatter = (value: number | null) => {
		return Formatter.currency.shortenNumber(value ?? 0);
	};

	return (
		<Accordion disabled={!chartData.length}>
			<AccordionSummary expandIcon={<ExpandMoreRounded />}>
				<Typography component="span">P/L Statements</Typography>
			</AccordionSummary>
			<AccordionDetails sx={{ px: 0 }}>
				<Box>
					<Tabs
						value={currentTab}
						onChange={(_, value) => setCurrentTab(value)}
						sx={{ mx: 2 }}
					>
						<Tab label="Annual" value={"annual"} />
						<Tab label="Quarterly" value={"quarterly"} />
					</Tabs>
				</Box>
				<Divider />
				<Box>
					<BarChart
						height={screenSize === "small" ? 230 : 300}
						margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
						hideLegend
						grid={{ horizontal: true }}
						yAxis={[
							{
								valueFormatter: (value: number) =>
									Formatter.currency.shortenNumber(value ?? 0),
								width: 80,
							},
						]}
						xAxis={[
							{
								scaleType: "band",
								data: chartData
									.map(({ date }) => Formatter.date.format(date))
									.reverse(),
								valueFormatter: (value) => value.toString(),
							},
						]}
						series={[
							{
								label: "Revenue",
								data: chartData.map(({ revenue }) => revenue).reverse(),
								valueFormatter: seriesFormatter,
							},
							{
								label: "Net Profit",
								data: chartData.map(({ netIncome }) => netIncome).reverse(),
								valueFormatter: seriesFormatter,
							},
						]}
					/>
				</Box>
				<Divider />
				<Box>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell />
									{tableData.labels.map((label) => (
										<TableCell align="right" key={label}>
											{label}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{tableData.data.map((row) => (
									<TableRow
										key={row.label.toLowerCase().replaceAll(/ /g, "_")}
										sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
									>
										<TableCell component="th" scope="row">
											{row.label}
										</TableCell>
										<TableCell align="right">
											{Formatter.currency.shortenNumber(row.prevValue)}
										</TableCell>
										<TableCell align="right">
											{Formatter.currency.shortenNumber(row.latestValue)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			</AccordionDetails>
		</Accordion>
	);
};
