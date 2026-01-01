import type z from "zod";
import type { UserID } from "./schemas/common.schema";

export type TypeOfSchema<Schema extends z.ZodType> = z.infer<Schema>;

/**
 * Type helper to extract the API response type from a schema extending `ApiResponse`.
 */
export type TApiResponse<Schema extends z.ZodObject> = TypeOfSchema<Schema>;
// REVISIT: Check if we can use this in order to close the gap between runtime and compile-time types
// export type TApiResponse<Schema extends typeof ApiResponse> =
// 	TypeOfSchema<Schema>;

/**
 * Type helper to create branded UserID strings.
 */
export type TUserID = TypeOfSchema<typeof UserID>;

/**
 * Type helper to represent a result that can either be a success or an error.
 */
export type TResult<T, E extends Error = Error> = [T, null] | [null, E];
