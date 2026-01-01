import type { IBaseGetAllQuery } from "./query.interface";

export interface IGetAllRecurringPaymentsQuery extends IBaseGetAllQuery {
	$executeFrom?: number;
	$executeTo?: number;
}
