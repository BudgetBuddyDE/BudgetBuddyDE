import { Box } from "@mui/material";
import type React from "react";
import { Card } from "@/components/Card";
import type { TAsset } from "@/types";
import { DividendAccordion } from "./DividendAccordion";
import { EarningsProfitAccordion } from "./EarningsProfitAccordion";
import { FinancialsAccordion } from "./FinancialsAccordion";

export type FinancialStatementsProps = {
	currency: string;
	financials: TAsset["financials"];
	historicalDividends: TAsset["dividends"]["yearlyTTM"];
};

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
	currency,
	financials,
	historicalDividends,
}) => {
	return (
		<Card>
			<Card.Header>
				<Box>
					<Card.Title>Financial Statements</Card.Title>
					<Card.Subtitle>
						Overview of the company's financial performance
					</Card.Subtitle>
				</Box>
			</Card.Header>
			<Card.Body>
				<FinancialsAccordion currency={currency} financials={financials} />
				<EarningsProfitAccordion currency={currency} financials={financials} />
				<DividendAccordion
					currency={currency}
					data={historicalDividends ?? []}
				/>
			</Card.Body>
		</Card>
	);
};
