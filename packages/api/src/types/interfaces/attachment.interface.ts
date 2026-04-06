export interface IGetAllAttachmentsQuery {
	/** Optional starting index for pagination. */
	from?: number;
	/** Optional ending index for pagination. */
	to?: number;
	/** Time-to-live in seconds for signed URLs (60–3600). */
	ttl?: number;
}
