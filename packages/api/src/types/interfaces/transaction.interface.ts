import type {TCategory} from '../category.type';
import type {TPaymentMethod} from '../paymentMethod.type';
import type {IBaseGetAllQuery} from './query.interface';

export interface IGetAllTransactionsQuery extends IBaseGetAllQuery {
  $dateFrom?: Date;
  $type?: 'income' | 'expense';
  sort?: 'date' | 'amount' | 'category';
  order?: 'asc' | 'desc';
  $dateTo?: Date;
  $categories?: TCategory['id'][];
  $excl_categories?: TCategory['id'][];
  $paymentMethods?: TPaymentMethod['id'][];
  $excl_paymentMethods?: TPaymentMethod['id'][];
}
