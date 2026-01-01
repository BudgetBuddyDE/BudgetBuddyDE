import z from "zod";

/**
 * Type helper to create branded UserID strings.
 */
export const UserID = z.string().brand("UserID");

/**
 * In order to use this schema, extend it and add the `data` field with the appropriate type.
 * @example
 * ```ts
 * const GetUserResponse = ApiResponse.extend({
 *   data: z.string(),
 * });
 * ```
 */
export const ApiResponse = z.object({
	status: z.number(),
	message: z.string().optional(),
	data: z.any().optional(),
	totalCount: z.number().optional(),
	from: z.enum(["db", "cache", "external"]).optional(),
});
