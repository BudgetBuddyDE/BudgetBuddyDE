// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './../..';
import * as __ from './../../_';
import * as _sap_common from './../../sap/common';

export type Description = string;
export type ISIN = string;
// enum
const Budget_type = {
  include: "include",
  exclude: "exclude",
} as const;
type Budget_type = "include" | "exclude"

export function _UserAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class User extends _._managedAspect(Base) {
    declare userId?: __.Key<string>
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<User>;
    declare static readonly elements: __.ElementsOf<User>;
    declare static readonly actions: typeof _.managed.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class User extends _UserAspect(__.Entity) {}
Object.defineProperty(User, 'name', { value: 'de.budgetbuddy.User' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'de.budgetbuddy.User' })

export function _CategoryAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Category extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare name?: string | null
    declare description?: Description | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Category> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<Category>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Category extends _CategoryAspect(__.Entity) {}
Object.defineProperty(Category, 'name', { value: 'de.budgetbuddy.Category' })
Object.defineProperty(Category, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Categories extends Array<Category> {$count?: number}
Object.defineProperty(Categories, 'name', { value: 'de.budgetbuddy.Category' })

export function _PaymentMethodAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class PaymentMethod extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare name?: string | null
    declare provider?: string | null
    declare address?: string | null
    declare description?: Description | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<PaymentMethod> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<PaymentMethod>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class PaymentMethod extends _PaymentMethodAspect(__.Entity) {}
Object.defineProperty(PaymentMethod, 'name', { value: 'de.budgetbuddy.PaymentMethod' })
Object.defineProperty(PaymentMethod, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class PaymentMethods extends Array<PaymentMethod> {$count?: number}
Object.defineProperty(PaymentMethods, 'name', { value: 'de.budgetbuddy.PaymentMethod' })

export function _TransactionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Transaction extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare toCategory?: __.Association.to<Category> | null
    declare toCategory_ID?: string | null
    declare toPaymentMethod?: __.Association.to<PaymentMethod> | null
    declare toPaymentMethod_ID?: string | null
    declare processedAt?: __.CdsDateTime | null
    declare receiver?: string | null
    declare transferAmount?: number | null
    declare information?: Description | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Transaction> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<Transaction>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Transaction extends _TransactionAspect(__.Entity) {}
Object.defineProperty(Transaction, 'name', { value: 'de.budgetbuddy.Transaction' })
Object.defineProperty(Transaction, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Transactions extends Array<Transaction> {$count?: number}
Object.defineProperty(Transactions, 'name', { value: 'de.budgetbuddy.Transaction' })

export function _SubscriptionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Subscription extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare toCategory?: __.Association.to<Category> | null
    declare toCategory_ID?: string | null
    declare toPaymentMethod?: __.Association.to<PaymentMethod> | null
    declare toPaymentMethod_ID?: string | null
    declare paused?: boolean | null
    declare executeAt?: number | null
    declare receiver?: __.DeepRequired<Transaction>['receiver'] | null
    declare transferAmount?: __.DeepRequired<Transaction>['transferAmount'] | null
    declare information?: __.DeepRequired<Transaction>['information'] | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Subscription> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<Subscription>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Subscription extends _SubscriptionAspect(__.Entity) {}
Object.defineProperty(Subscription, 'name', { value: 'de.budgetbuddy.Subscription' })
Object.defineProperty(Subscription, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Subscriptions extends Array<Subscription> {$count?: number}
Object.defineProperty(Subscriptions, 'name', { value: 'de.budgetbuddy.Subscription' })

export function _BudgetAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Budget extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare label?: string | null
    declare categories?: __.Composition.of.many<Budget.categories>
    declare type?: Budget_type | null
    declare budget?: number | null
    static type = Budget_type;
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Budget> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<Budget>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Budget extends _BudgetAspect(__.Entity) {}
Object.defineProperty(Budget, 'name', { value: 'de.budgetbuddy.Budget' })
Object.defineProperty(Budget, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Budgets extends Array<Budget> {$count?: number}
Object.defineProperty(Budgets, 'name', { value: 'de.budgetbuddy.Budget' })

export function _NewsletterAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Newsletter extends Base {
    declare newsletter?: __.Key<string>
    declare name?: string | null
    declare enabled?: boolean | null
    declare description?: Description | null
    declare texts?: __.Composition.of.many<Newsletter.texts>
    declare localized?: __.Association.to<Newsletter.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Newsletter>;
    declare static readonly elements: __.ElementsOf<Newsletter>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Newsletter extends _NewsletterAspect(__.Entity) {}
Object.defineProperty(Newsletter, 'name', { value: 'de.budgetbuddy.Newsletter' })
Object.defineProperty(Newsletter, 'is_singular', { value: true })
export class Newsletters extends Array<Newsletter> {$count?: number}
Object.defineProperty(Newsletters, 'name', { value: 'de.budgetbuddy.Newsletter' })

export function _NewsletterSubscriptionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class NewsletterSubscription extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare newsletter?: __.Association.to<Newsletter> | null
    declare newsletter_newsletter?: string | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<NewsletterSubscription> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<NewsletterSubscription>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class NewsletterSubscription extends _NewsletterSubscriptionAspect(__.Entity) {}
Object.defineProperty(NewsletterSubscription, 'name', { value: 'de.budgetbuddy.NewsletterSubscription' })
Object.defineProperty(NewsletterSubscription, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class NewsletterSubscriptions extends Array<NewsletterSubscription> {$count?: number}
Object.defineProperty(NewsletterSubscriptions, 'name', { value: 'de.budgetbuddy.NewsletterSubscription' })

export function _StockExchangeAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class StockExchange extends Base {
    declare symbol?: __.Key<string>
    declare exchange?: string | null
    declare name?: string | null
    declare texts?: __.Composition.of.many<StockExchange.texts>
    declare localized?: __.Association.to<StockExchange.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<StockExchange>;
    declare static readonly elements: __.ElementsOf<StockExchange>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class StockExchange extends _StockExchangeAspect(__.Entity) {}
Object.defineProperty(StockExchange, 'name', { value: 'de.budgetbuddy.StockExchange' })
Object.defineProperty(StockExchange, 'is_singular', { value: true })
export class StockExchanges extends Array<StockExchange> {$count?: number}
Object.defineProperty(StockExchanges, 'name', { value: 'de.budgetbuddy.StockExchange' })

export function _StockWatchlistAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class StockWatchlist extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare exchange?: __.Association.to<StockExchange> | null
    declare exchange_symbol?: string | null
    declare isin?: ISIN | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<StockWatchlist> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<StockWatchlist>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockWatchlist extends _StockWatchlistAspect(__.Entity) {}
Object.defineProperty(StockWatchlist, 'name', { value: 'de.budgetbuddy.StockWatchlist' })
Object.defineProperty(StockWatchlist, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockWatchlists extends Array<StockWatchlist> {$count?: number}
Object.defineProperty(StockWatchlists, 'name', { value: 'de.budgetbuddy.StockWatchlist' })

export function _StockPositionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class StockPosition extends _._cuidAspect(_._managedAspect(Base)) {
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare exchange?: __.Association.to<StockExchange> | null
    declare exchange_symbol?: string | null
    declare boughtAt?: __.CdsDateTime | null
    declare isin?: ISIN | null
    declare buyIn?: number | null
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
    declare currency?: _.Currency | null
    declare currency_code?: string | null
    declare quantity?: number | null
    static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<StockPosition> & typeof _.cuid.keys;
    declare static readonly elements: __.ElementsOf<StockPosition>;
    declare static readonly actions: typeof _.managed.actions & typeof _.cuid.actions & globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockPosition extends _StockPositionAspect(__.Entity) {}
Object.defineProperty(StockPosition, 'name', { value: 'de.budgetbuddy.StockPosition' })
Object.defineProperty(StockPosition, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockPositions extends Array<StockPosition> {$count?: number}
Object.defineProperty(StockPositions, 'name', { value: 'de.budgetbuddy.StockPosition' })

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
  Object.defineProperty(category, 'name', { value: 'de.budgetbuddy.Budget.categories' })
  Object.defineProperty(category, 'is_singular', { value: true })
  export class categories extends Array<category> {$count?: number}
  Object.defineProperty(categories, 'name', { value: 'de.budgetbuddy.Budget.categories' })
  
}
export namespace Newsletter {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends _sap_common._TextsAspectAspect(Base) {
      declare newsletter?: __.Key<string>
      declare name?: string | null
      declare description?: Description | null
      static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text> & typeof _sap_common.TextsAspect.keys;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: typeof _sap_common.TextsAspect.actions & globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'de.budgetbuddy.Newsletter.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'de.budgetbuddy.Newsletter.texts' })
  
}
export namespace StockExchange {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends _sap_common._TextsAspectAspect(Base) {
      declare symbol?: __.Key<string>
      declare name?: string | null
      static override readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text> & typeof _sap_common.TextsAspect.keys;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: typeof _sap_common.TextsAspect.actions & globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'de.budgetbuddy.StockExchange.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'de.budgetbuddy.StockExchange.texts' })
  
}