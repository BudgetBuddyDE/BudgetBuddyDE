import type {TCategory} from '../category.type';
import type {TPaymentMethod} from '../paymentMethod.type';
import type {IBaseGetAllQuery} from './query.interface';

export interface IGetAllRecurringPaymentsQuery extends IBaseGetAllQuery {
  $paused?: boolean;
  $categories?: TCategory['id'][];
  $excl_categories?: TCategory['id'][];
  $paymentMethods?: TPaymentMethod['id'][];
  $excl_paymentMethods?: TPaymentMethod['id'][];
}

export interface IGetRecurringPaymentOccurrencesQuery extends IBaseGetAllQuery {
  $dateFrom: string | Date;
  $dateTo: string | Date;
  $includePaused?: boolean;
  $categories?: TCategory['id'][];
  $excl_categories?: TCategory['id'][];
  $paymentMethods?: TPaymentMethod['id'][];
  $excl_paymentMethods?: TPaymentMethod['id'][];
}
