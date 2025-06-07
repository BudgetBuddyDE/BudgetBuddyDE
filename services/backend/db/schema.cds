namespace de.budgetbuddy;

using {
  cuid,
  managed,
  Currency
} from '@sap/cds/common';

type Description : LargeString default null;
type ISIN        : String(12) @assert.notNull;

@plural       : 'Users'
@assert.unique: {userId: [userId]}
entity User : managed {
  key userId : String @assert.notNull;
}

@plural       : 'Categories'
@assert.unique: {owner: [
  owner,
  name
]}
entity Category : cuid, managed {
  owner       : Association to User @assert.notNull;
  name        : String(80)          @assert.notNull;
  description : Description;
}

@plural       : 'PaymentMethods'
@assert.unique: {owner: [
  owner,
  name,
  provider,
  address
]}
entity PaymentMethod : cuid, managed {
  owner       : Association to User @assert.notNull;
  name        : String(80)          @assert.notNull;
  provider    : String(100)         @assert.notNull;
  address     : String(100)         @assert.notNull;
  description : Description;
}

@plural: 'Transactions'
entity Transaction : cuid, managed {
  owner           : Association to User          @assert.notNull;
  toCategory      : Association to Category      @assert.notNull;
  toPaymentMethod : Association to PaymentMethod @assert.notNull;
  processedAt     : DateTime                     @assert.notNull;
  receiver        : String(255)                  @assert.notNull;
  transferAmount  : Double                       @assert.notNull;
  information     : Description;
// FIXME: Add field for file attachments
}

@plural: 'Subscriptions'
entity Subscription : cuid, managed {
  owner           : Association to User          @assert.notNull;
  toCategory      : Association to Category      @assert.notNull;
  toPaymentMethod : Association to PaymentMethod @assert.notNull;
  paused          : Boolean default false;
  executeAt       : Integer                      @assert.range: [
    1,
    31
  ];
  receiver        : type of Transaction : receiver;
  transferAmount  : type of Transaction : transferAmount;
  information     : type of Transaction : information;
}

@plural: 'Budgets'
entity Budget : cuid, managed {
  owner      : Association to User @assert.notNull;
  label      : String              @assert.notNull;
  categories : Composition of many {
                 key category : Association to Category @assert.notNull;
               };
  type       : String              @assert.range enum {
    include;
    exclude;
  };
  budget     : Double              @assert.notNull  @assert.range: [
    (0),
    _
  ];
}

@plural       : 'Newsletters'
@assert.unique: {newsletter: [newsletter]}
entity Newsletter {
  key newsletter  : String;
      name        : localized String @assert.notNull;
      enabled     : Boolean default false;
      description : localized Description;
}

@plural       : 'NewsletterSubscriptions'
@assert.unique: {owner: [
  owner,
  newsletter
]}
entity NewsletterSubscription : cuid, managed {
  owner      : Association to User       @assert.notNull;
  newsletter : Association to Newsletter @assert.notNull;
}

@plural       : 'StockExchanges'
@assert.unique: {stockExchange: [
  symbol,
  exchange
]}
entity StockExchange {
  key symbol   : String;
      exchange : String;
      name     : localized String @assert.notNull;
}

@plural       : 'StockWatchlists'
@assert.unique: {owner: [
  owner,
  exchange,
  isin
]}
entity StockWatchlist : cuid, managed {
  owner    : Association to User          @assert.notNull;
  exchange : Association to StockExchange @assert.notNull;
  isin     : ISIN;
}

@plural       : 'StockPositions'
@assert.unique: {owner: [
  owner,
  exchange,
  isin
]}
entity StockPosition : cuid, managed {
  owner    : Association to User          @assert.notNull;
  exchange : Association to StockExchange @assert.notNull;
  boughtAt : DateTime                     @assert.notNull;
  isin     : ISIN;
  buyIn    : Double                       @assert.notNull;
  currency : Currency                     @assert.notNull;
  quantity : Double                       @assert.notNull;
}
