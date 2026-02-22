import type { TCategory } from "../category.type";
import type { TPaymentMethod } from "../paymentMethod.type";
import type { IBaseGetAllQuery } from "./query.interface";

export interface IGetAllTransactionsQuery extends IBaseGetAllQuery {
	$dateFrom?: Date;
	$dateTo?: Date;
	$categories?: TCategory["id"][];
	$excl_categories?: TCategory["id"][];
	$paymentMethods?: TPaymentMethod["id"][];
	$excl_paymentMethods?: TPaymentMethod["id"][];
}
