// This is an automatically generated file. Please do not change its contents manually!
import * as _ from './..';
import * as __ from './../_';
import * as _de_budgetbuddy from './../de/budgetbuddy';
import * as _sap_common from './../sap/common';

export default class {
}

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
Object.defineProperty(User, 'name', { value: 'SecurityService.User' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'SecurityService.User' })

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
Object.defineProperty(StockExchange, 'name', { value: 'SecurityService.StockExchange' })
Object.defineProperty(StockExchange, 'is_singular', { value: true })
export class StockExchanges extends Array<StockExchange> {$count?: number}
Object.defineProperty(StockExchanges, 'name', { value: 'SecurityService.StockExchange' })

export function _StockWatchlistAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class StockWatchlist extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare exchange?: __.Association.to<StockExchange> | null
    declare exchange_symbol?: string | null
    declare isin?: _de_budgetbuddy.ISIN | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<StockWatchlist>;
    declare static readonly elements: __.ElementsOf<StockWatchlist>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockWatchlist extends _StockWatchlistAspect(__.Entity) {}
Object.defineProperty(StockWatchlist, 'name', { value: 'SecurityService.StockWatchlist' })
Object.defineProperty(StockWatchlist, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockWatchlists extends Array<StockWatchlist> {$count?: number}
Object.defineProperty(StockWatchlists, 'name', { value: 'SecurityService.StockWatchlist' })

export function _StockPositionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class StockPosition extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare exchange?: __.Association.to<StockExchange> | null
    declare exchange_symbol?: string | null
    declare boughtAt?: __.CdsDateTime | null
    declare isin?: _de_budgetbuddy.ISIN | null
    declare buyIn?: number | null
    /**
    * Type for an association to Currencies
    * 
    * See https://cap.cloud.sap/docs/cds/common#type-currency
    */
    declare currency?: _.Currency | null
    declare currency_code?: string | null
    declare quantity?: number | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<StockPosition>;
    declare static readonly elements: __.ElementsOf<StockPosition>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockPosition extends _StockPositionAspect(__.Entity) {}
Object.defineProperty(StockPosition, 'name', { value: 'SecurityService.StockPosition' })
Object.defineProperty(StockPosition, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class StockPositions extends Array<StockPosition> {$count?: number}
Object.defineProperty(StockPositions, 'name', { value: 'SecurityService.StockPosition' })

export function _CurrencyAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Currency extends Base {
    declare name?: string | null
    declare descr?: string | null
    declare code?: __.Key<string>
    declare symbol?: string | null
    declare minorUnit?: number | null
    declare texts?: __.Composition.of.many<Currencies.texts>
    declare localized?: __.Association.to<Currencies.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Currency>;
    declare static readonly elements: __.ElementsOf<Currency>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currency extends _CurrencyAspect(__.Entity) {}
Object.defineProperty(Currency, 'name', { value: 'SecurityService.Currencies' })
Object.defineProperty(Currency, 'is_singular', { value: true })
/**
* Code list for currencies
* 
* See https://cap.cloud.sap/docs/cds/common#entity-currencies
*/
export class Currencies extends Array<Currency> {$count?: number}
Object.defineProperty(Currencies, 'name', { value: 'SecurityService.Currencies' })

export namespace StockExchange {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare symbol?: __.Key<string>
      declare name?: string | null
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'SecurityService.StockExchange.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'SecurityService.StockExchange.texts' })
  
}
export namespace Currencies {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare name?: string | null
      declare descr?: string | null
      declare code?: __.Key<string>
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'SecurityService.Currencies.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'SecurityService.Currencies.texts' })
  
}