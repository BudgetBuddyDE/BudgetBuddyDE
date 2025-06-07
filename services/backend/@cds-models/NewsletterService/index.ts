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
Object.defineProperty(User, 'name', { value: 'NewsletterService.User' })
Object.defineProperty(User, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class Users extends Array<User> {$count?: number}
Object.defineProperty(Users, 'name', { value: 'NewsletterService.User' })

export function _NewsletterAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class Newsletter extends Base {
    declare newsletter?: __.Key<string>
    declare name?: string | null
    declare enabled?: boolean | null
    declare description?: _de_budgetbuddy.Description | null
    declare texts?: __.Composition.of.many<Newsletter.texts>
    declare localized?: __.Association.to<Newsletter.text> | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<Newsletter>;
    declare static readonly elements: __.ElementsOf<Newsletter>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
export class Newsletter extends _NewsletterAspect(__.Entity) {}
Object.defineProperty(Newsletter, 'name', { value: 'NewsletterService.Newsletter' })
Object.defineProperty(Newsletter, 'is_singular', { value: true })
export class Newsletters extends Array<Newsletter> {$count?: number}
Object.defineProperty(Newsletters, 'name', { value: 'NewsletterService.Newsletter' })

export function _NewsletterSubscriptionAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class NewsletterSubscription extends Base {
    declare ID?: __.Key<string>
    declare createdAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare createdBy?: _.User | null
    declare modifiedAt?: __.CdsTimestamp | null
    /** Canonical user ID */
    declare modifiedBy?: _.User | null
    declare owner?: __.Association.to<User> | null
    declare owner_userId?: string | null
    declare newsletter?: __.Association.to<Newsletter> | null
    declare newsletter_newsletter?: string | null
    static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
    declare static readonly keys: __.KeysOf<NewsletterSubscription>;
    declare static readonly elements: __.ElementsOf<NewsletterSubscription>;
    declare static readonly actions: globalThis.Record<never, never>;
  };
}
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class NewsletterSubscription extends _NewsletterSubscriptionAspect(__.Entity) {}
Object.defineProperty(NewsletterSubscription, 'name', { value: 'NewsletterService.NewsletterSubscription' })
Object.defineProperty(NewsletterSubscription, 'is_singular', { value: true })
/**
* Aspect to capture changes by user and name
* 
* See https://cap.cloud.sap/docs/cds/common#aspect-managed
*/
export class NewsletterSubscriptions extends Array<NewsletterSubscription> {$count?: number}
Object.defineProperty(NewsletterSubscriptions, 'name', { value: 'NewsletterService.NewsletterSubscription' })

export namespace Newsletter {
  export function _textAspect<TBase extends new (...args: any[]) => object>(Base: TBase) {
    return class text extends Base {
      /** Type for a language code */
      declare locale?: __.Key<_sap_common.Locale>
      declare newsletter?: __.Key<string>
      declare name?: string | null
      declare description?: _de_budgetbuddy.Description | null
      static readonly kind: 'entity' | 'type' | 'aspect' = 'entity';
      declare static readonly keys: __.KeysOf<text>;
      declare static readonly elements: __.ElementsOf<text>;
      declare static readonly actions: globalThis.Record<never, never>;
    };
  }
  export class text extends _textAspect(__.Entity) {}
  Object.defineProperty(text, 'name', { value: 'NewsletterService.Newsletter.texts' })
  Object.defineProperty(text, 'is_singular', { value: true })
  export class texts extends Array<text> {$count?: number}
  Object.defineProperty(texts, 'name', { value: 'NewsletterService.Newsletter.texts' })
  
}