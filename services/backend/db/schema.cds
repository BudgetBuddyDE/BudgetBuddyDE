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

type ISIN        : String(12) @assert.notNull;


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
    toCategory      : Association to one Category      @assert.target
                                                       @assert.notNull;
    toPaymentMethod : Association to one PaymentMethod @assert.target
                                                       @assert.notNull;
    processedAt     : DateTime                         @assert.notNull;
    receiver        : String(255)                      @assert.notNull;
    transferAmount  : Double                           @assert.notNull;
    information     : Description;
// FIXME: Add field for file attachments
}

@plural: 'CategoryStats'
view CategoryStats as
    select from Transaction {
        toCategory,
        virtual 0        as income   : type of Transaction : transferAmount,
        virtual 0        as expenses : type of Transaction : transferAmount,
        virtual 0        as balance  : type of Transaction : transferAmount,
        // start, end and processedAt needs to be included for filtering
        min(processedAt) as start    : type of Transaction : processedAt,
        max(processedAt) as end      : type of Transaction : processedAt,
        processedAt                  : type of Transaction : processedAt,
        createdBy
    }
    group by
        toCategory.ID;


@plural: 'Subscriptions'
entity Subscription : cuid, managed {
            owner           : UserID;
            toCategory      : Association to one Category      @assert.target
                                                               @assert.notNull;
            toPaymentMethod : Association to one PaymentMethod @assert.target
                                                               @assert.notNull;
            paused          : Boolean default false;
            executeAt       : Integer                          @assert.range: [
                1,
                31
            ];
    virtual nextExecution   : Date;
            receiver        : type of Transaction : receiver;
            transferAmount  : type of Transaction : transferAmount;
            information     : type of Transaction : information;
}

@plural: 'StockExchanges'
entity StockExchange {
    key symbol        : String(25);
        name          : String(50) @assert.notNull;
        technicalName : String(50) @assert.notNull;
        createdAt     : Timestamp  @cds.on.insert: $now;
        modifiedAt    : Timestamp  @cds.on.insert: $now
                                   @cds.on.update: $now;
}

@plural       : 'StockPositions'
@assert.unique: {owner: [
    owner,
    toExchange,
    isin
]}
entity StockPosition : cuid, managed {
    toExchange    : Association to one StockExchange @assert.target
                                                     @assert.notNull;
    isin          : ISIN;
    quantity      : Double                           @assert.notNull;
    purchaseAt    : DateTime                         @assert.notNull;
    purchasePrice : Double                           @assert.notNull;
    description   : Description;
    owner         : UserID;
}

@plural       : 'StockWatchlists'
@assert.unique: {owner: [
    owner,
    toExchange,
    isin
]}
entity StockWatchlist : cuid, managed {
    toExchange  : Association to one StockExchange @assert.target
                                                   @assert.notNull;
    isin        : ISIN;
    targetPrice : Double                           @assert.notNull
                                                   @assert.range: [
        (0),
        _
    ];
    owner       : UserID;
}
