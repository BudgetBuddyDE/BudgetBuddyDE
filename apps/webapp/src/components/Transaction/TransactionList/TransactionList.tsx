"use client";

import {
	AddRounded as AddIcon,
	ReceiptRounded as ReceiptIcon,
} from "@mui/icons-material";
import { Box, Chip, type ChipProps, IconButton } from "@mui/material";
import type React from "react";

import { Card, type CardProps } from "@/components/Card";
import { CategoryChip } from "@/components/Category/CategoryChip";
import { ListWithIcon } from "@/components/ListWithIcon";
import { NoResults } from "@/components/NoResults";
import { PaymentMethodChip } from "@/components/PaymentMethod/PaymentMethodChip";
import { Formatter } from "@/utils/Formatter";

export type EntityListProps<T> = {
	isLoading?: boolean;
	title: string;
	subtitle?: string;
	noResultsMessage?: string;
	data: T[];
	onAddEntity?: () => void;
	cardProps?: CardProps;
};

export type TransactionListProps = EntityListProps<{
	ID: string;
	receiver: string;
	processedAt: Date;
	transferAmount: number;
	category: {
		ID: string;
		name: string;
	};
	paymentMethod: {
		ID: string;
		name: string;
	};
}>;

export const TransactionList: React.FC<TransactionListProps> = ({
	title,
	subtitle,
	noResultsMessage = "You haven't made any purchases yet",
	data,
	onAddEntity,
	cardProps,
}) => {
	const chipProps: ChipProps = {
		variant: "outlined",
		size: "small",
		sx: { mr: 1 },
	};

	return (
		<Card {...cardProps}>
			<Card.Header sx={{ mb: 1 }}>
				<Box>
					<Card.Title>{title}</Card.Title>
					{subtitle !== undefined && subtitle.length > 0 && (
						<Card.Subtitle>{subtitle}</Card.Subtitle>
					)}
				</Box>
				{onAddEntity && (
					<Card.HeaderActions>
						<IconButton color="primary" onClick={onAddEntity}>
							<AddIcon />
						</IconButton>
					</Card.HeaderActions>
				)}
			</Card.Header>
			<Card.Body>
				{data.length > 0 ? (
					data.map((transaction) => (
						<ListWithIcon
							key={transaction.ID}
							icon={<ReceiptIcon />}
							title={transaction.receiver}
							subtitle={
								<Box>
									<Chip
										label={Formatter.date.format(transaction.processedAt, true)}
										sx={{ mr: 1 }}
										{...chipProps}
									/>
									<CategoryChip
										categoryName={transaction.category.name}
										{...chipProps}
									/>
									<PaymentMethodChip
										paymentMethodName={transaction.paymentMethod.name}
										{...chipProps}
									/>
								</Box>
							}
							amount={transaction.transferAmount}
						/>
					))
				) : (
					<NoResults text={noResultsMessage} />
				)}
			</Card.Body>
		</Card>
	);
};
