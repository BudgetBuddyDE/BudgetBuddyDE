import { z } from "zod";

// export type NullableFields<T> = {
// 	[K in keyof T]?: T[K] | null;
// };

export const UserID = z.string().brand("UserID");

export const ApiResponse = z.object({
	status: z.number(),
	message: z.string().optional(),
	totalCount: z.number().optional(),
	from: z.enum(["db", "cache", "external"]).optional(),
});
export type TApiResponse<T> = z.infer<typeof ApiResponse> & {
	data: T;
};

// export const UserID = z.string().nonempty();

export const DescriptionType = z
	.string()
	.nullable()
	.default(null)
	.transform((val) => (val === "" ? null : val));

export const ODataContextAspect = z.object({
	"@odata.context": z.string().optional(),
});

export const ODataCountAspect = z.object({
	"@odata.count": z.number().min(0),
});

export const OwnerAspect = z.object({
	owner: UserID,
});
