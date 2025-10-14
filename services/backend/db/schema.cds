namespace de.budgetbuddy;

using {
    cuid,
    managed,
} from '@sap/cds/common';

type Description  : LargeString default null;

type UserID       : String @assert.notNull
                           @cds.on.insert: $user;
// Automatically set to the user ID of the current user
// This may not even be necessary, as the user ID is already set by the framework when the entity inherits the `managed` aspect.

type ISIN         : String(12) @assert.notNull;
type CurrencyCode : String(3) @assert.notNull;


@plural       : 'Categories'
@assert.unique: {owner: [
    owner,
    name
]}
@cds.search   : {
    name,
    description
}
entity Category : cuid, managed {
    owner       : UserID;
    name        : String(80) @assert.notNull;
    description : Description;
}

type BudgetType   : String(1) enum {
    INCLUDE = 'i';
    EXCLUDE = 'e';
}

@plural: 'Budgets'
entity Budget : cuid, managed {
            owner        : UserID;
            type         : BudgetType;
    virtual balance      : Double;
            toCategories : Composition of many {
                               key toCategory : Association to one Category @assert.target;
                           };
            name         : String(40) @assert.notNull;
            budget       : Double     @assert.notNull
                                      @assert.range: [
                (0),
                _
            ];
}

@plural       : 'PaymentMethods'
@assert.unique: {owner: [
    owner,
    name,
    provider,
    address
]}
@cds.search   : {
    name,
    provider,
    address,
    description
}
entity PaymentMethod : cuid, managed {
    owner       : UserID;
    name        : String(80)  @assert.notNull;
    provider    : String(100) @assert.notNull;
    address     : String(100) @assert.notNull;
    description : Description;
}

@plural    : 'Transactions'
@cds.search: {
    receiver,
    information,
    toCategory.name
}
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
        key toCategory,
            virtual 0 as income   : type of Transaction : transferAmount,
            virtual 0 as expenses : type of Transaction : transferAmount,
            virtual 0 as balance  : type of Transaction : transferAmount,
            // REVISIT: start, end and processedAt needs to be included for filtering
            // min(processedAt) as start    : type of Transaction : processedAt,
            // max(processedAt) as end      : type of Transaction : processedAt,
            processedAt           : type of Transaction : processedAt,
            createdBy
    }
    group by
        toCategory.ID;

@odata.singleton
@cds.persistence.skip
@plural: 'MonthlyKPIs'
entity MonthlyKPI {
    receivedIncome   : Double;
    upcomingIncome   : Double;
    paidExpenses     : Double;
    upcomingExpenses : Double;
    currentBalance   : Double;
    estimatedBalance : Double;
}

@plural    : 'Subscriptions'
@cds.search: {
    receiver,
    information,
    toCategory.name
}
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
    isin,
    quantity,
    purchasePrice,
    purchasedAt
]}
entity StockPosition : cuid, managed {
            toExchange     : Association to one StockExchange @assert.target
                                                              @assert.notNull;
    virtual logoUrl        : String;
    virtual assetType      : String;
    virtual securityName   : String;
            isin           : ISIN;
            quantity       : Double                           @assert.notNull;
            purchasedAt    : DateTime                         @assert.notNull;
            purchasePrice  : Double                           @assert.notNull;
            purchaseFee    : Double default 0.0               @assert.notNull;
            description    : Description;
            owner          : UserID;
    virtual currentPrice   : Double;
    virtual positionValue  : Double;
    virtual absoluteProfit : Double;
    virtual relativeProfit : Double;
}


@plural: 'StockPositionAllocations'
entity StockPositionAllocation as
    select from StockPosition {
        isin,
        null     as securityName         : StockPosition:securityName,
        quantity as absolutePositionSize : StockPosition:positionValue,
        null     as relativePositionSize : Double,
    };

@odata.singleton
entity StockPositionsKPI {
    totalPositionValue               : Double;
    absoluteCapitalGains             : Double;
    unrealisedProfit                 : Double;
    freeCapitalOnProfitablePositions : Double;
    unrealisedLoss                   : Double;
    boundCapitalOnLosingPositions    : Double;
    upcomingDividends                : Double;
};

@cds.persistence.skip
@plural: 'Dividends'
entity Dividend {
    key identifier     : ISIN;
        payoutInterval : String;
        price          : Double;
        currency       : CurrencyCode;
        date           : Date;
        datetime       : DateTime;
        paymentDate    : Date;
        recordDate     : Date;
    key exDate         : Date;
        isEstimated    : Boolean;
};

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


@cds.persistence.skip
@plural: 'SearchAssets'
entity SearchAsset {
    key isin      : String(12);
        name      : String;
        logoUrl   : String;
        assetType : String;
}
