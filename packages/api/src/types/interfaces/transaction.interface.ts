import type { IBaseGetAllQuery } from "./query.interface";

export interface IGetAllTransactionsQuery extends IBaseGetAllQuery {
	$dateFrom?: Date;
	$dateTo?: Date;
}
