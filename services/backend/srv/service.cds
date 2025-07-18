using {de.budgetbuddy as db} from '../db/schema';

@restr
service BackendService {

  @plural                : 'Categories'
  @cds.redirection.target: 'Category'
  entity Category @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                 as projection on db.Category;

  @readonly
  view Category_VH @(restrict: [{
    grant: ['READ'],
    where: 'createdBy = $user'
  }]) as
    select from db.Category {
      ID,
      name,
      description,
      createdBy
    };

  @plural                : 'PaymentMethods'
  @cds.redirection.target: 'PaymentMethod'
  entity PaymentMethod @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                 as projection on db.PaymentMethod;

  @readonly
  view PaymentMethod_VH @(restrict: [{
    grant: ['READ'],
    where: 'createdBy = $user'
  }]) as
    select from db.PaymentMethod {
      ID,
      name,
      address,
      provider,
      description,
      createdBy
    };

  @plural: 'Transactions'
  entity Transaction  as projection on db.Transaction
                         order by
                           processedAt desc;

  @plural: 'Subscriptions'
  entity Subscription as projection on db.Subscription
                         order by
                           executeAt asc;


  @plural: 'CategoryStats'
  view CategoryStats @(restrict: [{
    grant: ['READ'],
    where: 'createdBy = $user'
  }]) as
    select from db.Transaction {
      toCategory,
      sum(transferAmount) as balance,
      sum(case
            when transferAmount > 0
                 then transferAmount
            else 0
          end)            as income,
      sum(case
            when transferAmount < 0
                 then abs(transferAmount)
            else 0
          end)            as expenses,
      count( * )          as transactionCount,
      // min(processedAt)    as start,
      // max(processedAt)    as end,
      createdBy
    }
    group by
      toCategory.ID;
}

@plural: 'StockExchanges'
entity StockExchange @(restrict: [{grant: ['READ']}]) as projection on db.StockExchange;

@plural: 'StockWatchlists'
entity StockWatchlist @(restrict: [{
  grant: [
    'READ',
    'CREATE',
    'UPDATE',
    'DELETE'
  ],
  where: 'createdBy = $user'
}])                                                   as projection on db.StockWatchlist;

@plural: 'StockPositions'
entity StockPosition @(restrict: [{
  grant: [
    'READ',
    'CREATE',
    'UPDATE',
    'DELETE'
  ],
  where: 'createdBy = $user'
}])                                                   as projection on db.StockPosition;
