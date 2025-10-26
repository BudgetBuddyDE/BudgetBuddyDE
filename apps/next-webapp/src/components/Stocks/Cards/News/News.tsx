import { NewspaperRounded } from "@mui/icons-material";
import {
	Box,
	Divider,
	Link,
	List,
	ListItem,
	ListItemText,
	Typography,
} from "@mui/material";
import NextLink from "next/link";
import React from "react";
import { Card } from "@/components/Card";
import { NoResults } from "@/components/NoResults";
import type { TAsset } from "@/types";
import { Formatter } from "@/utils/Formatter";

export type NewsProps = {
	news: TAsset["news"];
};

export const News: React.FC<NewsProps> = ({ news }) => {
	const hasNews = news.length > 0;
	return (
		<Card sx={{ p: 0 }}>
			<Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
				<Box>
					<Card.Title>News</Card.Title>
					<Card.Subtitle>
						{hasNews ? `Latest news updates` : `No news available`}
					</Card.Subtitle>
				</Box>
			</Card.Header>
			<Card.Body sx={{ p: hasNews ? 0 : 2 }}>
				{!hasNews && (
					<NoResults icon={<NewspaperRounded />} text={"No news available"} />
				)}

				{hasNews && (
					<List disablePadding sx={{ py: 0 }}>
						{news.map((entry, idx, arr) => (
							<React.Fragment key={entry.publishedAt.toISOString()}>
								<ListItem>
									<ListItemText
										primary={
											<Typography variant="caption" color="textSecondary">
												{Formatter.date.formatWithPattern(
													entry.publishedAt,
													"dd.MM.yy HH:mm",
												)}
											</Typography>
										}
										secondary={
											<React.Fragment>
												<Typography
													variant="body1"
													sx={{ color: "text.primary", fontWeight: "bolder" }}
												>
													{entry.title}
												</Typography>
												<Typography variant="body2">
													{entry.description}
												</Typography>
												<Link component={NextLink} href={entry.url}>
													Read more...
												</Link>
											</React.Fragment>
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
