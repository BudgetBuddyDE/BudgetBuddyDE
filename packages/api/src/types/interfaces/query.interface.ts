export interface IBaseGetAllQuery {
	/**
	 * Optional search string to filter results.
	 */
	search?: string;
	/**
	 * Optional starting index for pagination.
	 */
	from?: number;
	/**
	 * Optional ending index for pagination.
	 */
	to?: number;
}
