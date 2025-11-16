import {
	Alert,
	Box,
	Chip,
	Link,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { Card } from "@/components/Card";
import { ErrorAlert } from "@/components/ErrorAlert";
import { NoResults } from "@/components/NoResults";
import { headers } from "@/lib/headers";
import { AssetService } from "@/services/Stock";
import { Formatter } from "@/utils/Formatter";

export const MetalQuoteList = async () => {
	const [metals, err] = await AssetService.metal.getListWithQuotes(undefined, {
		headers: await headers(),
	});
	return (
		<Card sx={{ p: 0 }}>
			<Card.Header sx={{ p: 2, pb: 0 }}>
				<Box>
					<Card.Title>Metals</Card.Title>
					<Card.Subtitle>Todays metal quotes</Card.Subtitle>
				</Box>
			</Card.Header>
			<Card.Body sx={{ px: 0 }}>
				{err && <ErrorAlert error={err} />}

				{!metals ||
					(metals.length === 0 && <NoResults text={"No metal quotes found"} />)}

				{metals && metals.length > 0 && (
					<List dense>
						{(metals ?? []).map((metal) => {
							const prices = [
								{ currency: "EUR", price: metal.eur },
								{ currency: "USD", price: metal.usd },
							];
							return (
								<ListItem
									key={metal.symbol}
									secondaryAction={
										<Stack>
											{prices.map(({ price, currency }) => (
												<Typography
													key={`${metal.symbol}-${currency}`}
													variant="subtitle2"
													style={{ textAlign: "right" }}
												>
													{Formatter.currency.formatBalance(price, currency)}
												</Typography>
											))}
										</Stack>
									}
								>
									<ListItemText
										primary={
											<Typography fontWeight="bold">{metal.name}</Typography>
										}
										secondary={
											<Stack flexDirection={"row"}>
												<Chip
													size="small"
													variant="outlined"
													label={metal.symbol}
													sx={{ mr: 1 }}
												/>
												<Chip
													size="small"
													variant="outlined"
													label={"Troy Ounce"}
												/>
											</Stack>
										}
									/>
								</ListItem>
							);
						})}
					</List>
				)}
			</Card.Body>
			<Card.Footer sx={{ p: 2, pt: 0 }}>
				<Alert severity="info">
					The prices are provided by{" "}
					<Link
						href="https://metalpriceapi.com/"
						target="_blank"
						rel="noreferrer"
					>
						metalpriceapi.com
					</Link>
					.
				</Alert>
			</Card.Footer>
		</Card>
	);
};
