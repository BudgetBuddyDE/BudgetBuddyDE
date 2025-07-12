namespace de.budgetbuddy;

using {
  cuid,
  managed,
} from '@sap/cds/common';

type Description : LargeString default null;

type UserID      : String @assert.notNull
                          @cds.on.insert: $user;
// Automatically set to the user ID of the current user
// This may not even be necessary, as the user ID is already set by the framework when the entity inherits the `managed` aspect.

@plural       : 'Categories'
@assert.unique: {owner: [
  owner,
  name
]}
entity Category : cuid, managed {
  owner       : UserID;
  name        : String(80) @assert.notNull;
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
  owner       : UserID;
  name        : String(80)  @assert.notNull;
  provider    : String(100) @assert.notNull;
  address     : String(100) @assert.notNull;
  description : Description;
}

@plural: 'Transactions'
entity Transaction : cuid, managed {
  owner           : UserID;
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
  owner           : UserID;
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
