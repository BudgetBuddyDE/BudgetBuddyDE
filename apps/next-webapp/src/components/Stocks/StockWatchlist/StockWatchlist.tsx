"use client";

import { AddRounded, FormatListBulletedRounded } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import { useRouter } from "next/navigation";
import type React from "react";
import { Card } from "@/components/Card";
import { ListWithIcon } from "@/components/ListWithIcon";
import { NoResults } from "@/components/NoResults";
import { StockPrice } from "../StockPrice";

export type TStockWatchlistProps = {
	title: string;
	subtitle?: string;
	// biome-ignore lint/suspicious/noExplicitAny: This feature is not implemented yet
	data: any[];
	onAddItem?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const StockWatchlist: React.FC<TStockWatchlistProps> = ({
	title,
	subtitle,
	data,
	onAddItem,
}) => {
	const router = useRouter();

	return (
		<Card>
			<Card.Header>
				<Box>
					<Card.Title>{title}</Card.Title>
					{subtitle && <Card.Subtitle>{subtitle}</Card.Subtitle>}
				</Box>

				{onAddItem && (
					<Card.HeaderActions>
						<IconButton size="small" onClick={onAddItem}>
							<AddRounded color="primary" />
						</IconButton>
					</Card.HeaderActions>
				)}
			</Card.Header>
			<Card.Body>
				{data.length > 0 ? (
					data.map((asset) => (
						<ListWithIcon
							key={asset.id}
							title={asset.name}
							subtitle={
								<Box sx={{ display: "flex", flexDirection: "row" }}>
									<Chip
										variant="outlined"
										size="small"
										sx={{ mr: 1 }}
										label={asset.expand.exchange.symbol}
									/>
									<Chip
										variant="outlined"
										size="small"
										sx={{ mr: 1 }}
										label={asset.isin}
										onClick={async (event) => {
											event.stopPropagation();
											await navigator.clipboard.writeText(asset.isin);
											// FIXME: showSnackbar({message: 'Copied to clipboard'});
										}}
									/>
								</Box>
							}
							amount={<StockPrice price={asset.quote.price} />}
							imageUrl={asset.logo}
							onClick={() => router.push(`/stocks/${asset.isin}`)}
						/>
					))
				) : (
					<NoResults
						icon={<FormatListBulletedRounded />}
						text="You don't watch any assets yet."
						sx={{ mt: 2 }}
					/>
				)}
			</Card.Body>
		</Card>
	);
};
