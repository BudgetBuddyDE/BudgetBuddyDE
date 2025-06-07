// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _de_budgetbuddy from './../de/budgetbuddy';

export default class {
}

// enum
const Budget_type = {
  include: "include",
  exclude: "exclude",
} as const;
type Budget_type = "include" | "exclude"

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends Base {
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare userId?: __.Key<string>
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<User>;
    declare static readonly elements: __.ElementsOf<User>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'DataService.User' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'DataService.User' })

export function _CategoryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Category extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare name?: string | null
    declare description?: _de_budgetbuddy.Description | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Category>;
    declare static readonly elements: __.ElementsOf<Category>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Category extends _CategoryAspect(__.Entity) {}
Object.defineProperty(Category, 'name', { value: 'DataService.Category' })
Object.defineProperty(Category, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Categories extends Array<Category> {$count?: number}
Object.defineProperty(Categories, 'name', { value: 'DataService.Category' })

export function _PaymentMethodAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class PaymentMethod extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare name?: string | null
    declare provider?: string | null
    declare address?: string | null
    declare description?: _de_budgetbuddy.Description | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<PaymentMethod>;
    declare static readonly elements: __.ElementsOf<PaymentMethod>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class PaymentMethod extends _PaymentMethodAspect(__.Entity) {}
Object.defineProperty(PaymentMethod, 'name', { value: 'DataService.PaymentMethod' })
Object.defineProperty(PaymentMethod, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class PaymentMethods extends Array<PaymentMethod> {$count?: number}
Object.defineProperty(PaymentMethods, 'name', { value: 'DataService.PaymentMethod' })

export function _TransactionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Transaction extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare toCategory?: __.Association.to<Category> | null
    declare toCategory_ID?: string | null
    declare toPaymentMethod?: __.Association.to<PaymentMethod> | null
    declare toPaymentMethod_ID?: string | null
    declare processedAt?: __.CdsDateTime | null
    declare receiver?: string | null
    declare transferAmount?: number | null
    declare information?: _de_budgetbuddy.Description | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Transaction>;
    declare static readonly elements: __.ElementsOf<Transaction>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Transaction extends _TransactionAspect(__.Entity) {}
Object.defineProperty(Transaction, 'name', { value: 'DataService.Transaction' })
Object.defineProperty(Transaction, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Transactions extends Array<Transaction> {$count?: number}
Object.defineProperty(Transactions, 'name', { value: 'DataService.Transaction' })

export function _SubscriptionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Subscription extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare toCategory?: __.Association.to<Category> | null
    declare toCategory_ID?: string | null
    declare toPaymentMethod?: __.Association.to<PaymentMethod> | null
    declare toPaymentMethod_ID?: string | null
    declare paused?: boolean | null
    declare executeAt?: number | null
    declare receiver?: __.DeepRequired<_de_budgetbuddy.Transaction>['receiver'] | null
    declare transferAmount?: __.DeepRequired<_de_budgetbuddy.Transaction>['transferAmount'] | null
    declare information?: __.DeepRequired<_de_budgetbuddy.Transaction>['information'] | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Subscription>;
    declare static readonly elements: __.ElementsOf<Subscription>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Subscription extends _SubscriptionAspect(__.Entity) {}
Object.defineProperty(Subscription, 'name', { value: 'DataService.Subscription' })
Object.defineProperty(Subscription, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockWatchlists extends Array<Subscription> {$count?: number}
Object.defineProperty(StockWatchlists, 'name', { value: 'DataService.Subscription' })

export function _BudgetAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Budget extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare label?: string | null
    declare categories?: __.Composition.of.many<Budget.categories>
    declare type?: Budget_type | null
    declare budget?: number | null
    static type = Budget_type;
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Budget>;
    declare static readonly elements: __.ElementsOf<Budget>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Budget extends _BudgetAspect(__.Entity) {}
Object.defineProperty(Budget, 'name', { value: 'DataService.Budget' })
Object.defineProperty(Budget, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Budgets extends Array<Budget> {$count?: number}
Object.defineProperty(Budgets, 'name', { value: 'DataService.Budget' })

export namespace Budget {
  export function _categoryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class category extends Base {
      declare up_?: __.Key<__.Association.to<Budget>>
      declare up__ID?: __.Key<string>
      declare category?: __.Key<__.Association.to<Category>>
      declare category_ID?: __.Key<string>
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<category>;
      declare static readonly elements: __.ElementsOf<category>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class category extends _categoryAspect(__.Entity) {}
  Object.defineProperty(category, 'name', { value: 'DataService.Budget.categories' })
  Object.defineProperty(category, 'is_singular', { value: true })
  export class categories extends Array<category> {$count?: number}
  Object.defineProperty(categories, 'name', { value: 'DataService.Budget.categories' })
  
}