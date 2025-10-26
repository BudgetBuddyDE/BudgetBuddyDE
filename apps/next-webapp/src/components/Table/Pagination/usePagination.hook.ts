import React from "react";

import type { PaginationState } from "./Pagination.reducer";

/**
 * Get requested data for the current page
 */
export function usePagination<T>(
	data: T,
	{ page, rowsPerPage }: PaginationState,
): T {
	if (!Array.isArray(data)) {
		throw new Error("Provided data has to be an array");
	}

	const pageContent: T = React.useMemo(() => {
		return data.slice(
			page * rowsPerPage,
			page * rowsPerPage + rowsPerPage,
		) as T;
	}, [data, page, rowsPerPage]);

	return pageContent;
}
