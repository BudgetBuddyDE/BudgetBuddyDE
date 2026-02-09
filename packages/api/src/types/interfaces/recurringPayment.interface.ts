import type { TCategory } from "../category.type";
import type { TPaymentMethod } from "../paymentMethod.type";
import type { IBaseGetAllQuery } from "./query.interface";

export interface IGetAllRecurringPaymentsQuery extends IBaseGetAllQuery {
	$executeFrom?: number;
	$executeTo?: number;
	$categories?: TCategory["id"][];
	$paymentMethods?: TPaymentMethod["id"][];
}
