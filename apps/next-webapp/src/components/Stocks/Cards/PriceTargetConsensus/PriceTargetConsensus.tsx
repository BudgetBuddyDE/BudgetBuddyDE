import {
	Box,
	Divider,
	List,
	ListItem,
	ListItemText,
	Typography,
} from "@mui/material";
import React from "react";
import { Card } from "@/components/Card";
import { NoResults } from "@/components/NoResults";
import type { TAsset } from "@/types";
import { Formatter } from "@/utils/Formatter";

export type PriceTargetConsensusProps = {
	currency: string;
	priceTargetConsensus: Omit<
		TAsset["analysis"]["priceTargetConsensus"],
		"currency"
	> | null;
};

export const PriceTargetConsensus: React.FC<PriceTargetConsensusProps> = ({
	currency,
	priceTargetConsensus,
}) => {
	const converted = Object.entries(priceTargetConsensus ?? {}).map(
		([key, value]) => ({
			key,
			value: Number(value), // Only numbers are expected here and this is done for linting purposes
		}),
	);
	const hasConsensus = converted.length > 0;
	const labelMapping: Record<keyof typeof priceTargetConsensus, string> = {
		high: "High",
		consensus: "Consensus",
		median: "Median",
		low: "Low",
	};
	return (
		<Card sx={{ p: 0 }}>
			<Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
				<Box>
					<Card.Title>Price Target Consensus</Card.Title>
					<Card.Subtitle>Consensus price targets from analysts</Card.Subtitle>
				</Box>
			</Card.Header>
			<Card.Body sx={{ p: hasConsensus ? 0 : 2 }}>
				{!hasConsensus && <NoResults text={"No price target available"} />}

				{hasConsensus && (
					<List dense disablePadding sx={{ py: 0 }}>
						{converted.map(({ key, value }, idx, arr) => (
							<React.Fragment key={key}>
								<ListItem
									secondaryAction={
										<Typography>
											{Formatter.currency.formatBalance(value, currency)}
										</Typography>
									}
								>
									<ListItemText
										primary={
											<Typography>
												{labelMapping[key as keyof typeof labelMapping]}
											</Typography>
										}
									/>
								</ListItem>
								{idx + 1 !== arr.length && <Divider />}
							</React.Fragment>
						))}
					</List>
				)}
			</Card.Body>
		</Card>
	);
};
