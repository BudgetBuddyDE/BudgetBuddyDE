"use client";

import { Box, Link, Typography } from "@mui/material";
import React from "react";

export type ReadMoreTextProps = {
	text: string;
	maxLength?: number;
	labels?: Partial<{
		readMore: string;
		readLess: string;
	}>;
};

export const ReadMoreText: React.FC<ReadMoreTextProps> = ({
	text,
	labels = {
		readLess: "Read less",
		readMore: "Read more",
	},
	maxLength = 100,
}) => {
	const [expanded, setExpanded] = React.useState(false);
	const toggleText = () => {
		setExpanded((prev) => !prev);
	};

	return (
		<Box>
			<Typography variant="body1" sx={{ display: "inline" }}>
				{expanded ? text : `${text.slice(0, maxLength)}... `}
			</Typography>
			<br />
			<Link component="button" variant="body2" onClick={toggleText}>
				{expanded ? labels.readLess : labels.readMore}
			</Link>
		</Box>
	);
};
