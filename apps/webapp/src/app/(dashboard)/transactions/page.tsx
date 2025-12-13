import { Grid } from "@mui/material";
import { ContentGrid } from "@/components/Layout/ContentGrid";
import { TransactionTable } from "@/components/Transaction/TransactionTable";

export default async function TransactionsPage() {
	return (
		<ContentGrid title="Transactions">
			<Grid size="grow">
				<TransactionTable />
			</Grid>
		</ContentGrid>
	);
}
