namespace de.budgetbuddy;

using {de.budgetbuddy as types} from './types';
using {
    cuid,
    managed,
} from '@sap/cds/common';

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
    owner       : types.UserID;
    name        : String(80) @assert.notNull;
    description : types.Description;
}

@plural: 'Budgets'
entity Budget : cuid, managed {
            owner        : types.UserID;
            type         : types.BudgetType;
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
    owner       : types.UserID;
    name        : String(80)  @assert.notNull;
    provider    : String(100) @assert.notNull;
    address     : String(100) @assert.notNull;
    description : types.Description;
}

@plural    : 'Transactions'
@cds.search: {
    receiver,
    information,
    toCategory.name
}
entity Transaction : cuid, managed {
    owner           : types.UserID;
    toCategory      : Association to one Category      @assert.target
                                                       @assert.notNull;
    toPaymentMethod : Association to one PaymentMethod @assert.target
                                                       @assert.notNull;
    processedAt     : DateTime                         @assert.notNull;
    receiver        : String(255)                      @assert.notNull;
    transferAmount  : Double                           @assert.notNull;
    information     : types.Description;
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
            owner           : types.UserID;
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
            isin           : types.ISIN;
            quantity       : Double                           @assert.notNull;
            purchasedAt    : DateTime                         @assert.notNull;
            purchasePrice  : Double                           @assert.notNull;
            purchaseFee    : Double default 0.0               @assert.notNull;
            description    : types.Description;
            owner          : types.UserID;
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
    key identifier     : types.ISIN;
        payoutInterval : String;
        price          : Double;
        currency       : types.CurrencyCode;
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
    isin        : types.ISIN;
    targetPrice : Double                           @assert.notNull
                                                   @assert.range: [
        (0),
        _
    ];
    owner       : types.UserID;
}


@cds.persistence.skip
@plural: 'SearchAssets'
entity SearchAsset {
    key isin      : String(12);
        name      : String;
        logoUrl   : String;
        assetType : String;
}

@plural: 'Metals'
entity Metal {
    key symbol : String(3);
        name   : String(20);
        unit   : types.MetalUnit;
}

@plural: 'MetalQuotes'
entity MetalQuote              as
    select from Metal {
        symbol,
        name,
        unit,
        0 as eur : Double,
        0 as usd : Double,
    }
