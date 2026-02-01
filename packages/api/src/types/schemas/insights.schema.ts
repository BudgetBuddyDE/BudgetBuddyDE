import z from "zod";
import { Category } from "./category.schema";
import { ApiResponse } from "./common.schema";

export const HistoricalBalance = z.object({
	date: z.iso.datetime().or(z.date()),
	income: z.number(),
	expenses: z.number(),
	balance: z.number(),
});

export const HistoricalCategoryBalance = HistoricalBalance.extend({
	category: Category.pick({
		id: true,
		name: true,
		description: true,
	}),
});

export const GetHistoricalBalanceResponse = ApiResponse.extend({
	data: z.array(HistoricalBalance),
});

export const GetHistoricalCategoryBalanceResponse = ApiResponse.extend({
	data: z.array(HistoricalCategoryBalance),
});
