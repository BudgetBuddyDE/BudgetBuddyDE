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
  }])                                                   as projection on db.Category;

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
  }])                                                   as projection on db.PaymentMethod;

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
  entity Transaction @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                                                   as projection on db.Transaction
                                                           order by
                                                             processedAt desc;

  @plural: 'Subscriptions'
  entity Subscription @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                                                   as projection on db.Subscription
                                                           order by
                                                             executeAt asc;


  @plural: 'CategoryStats'
  view CategoryStats as select from db.CategoryStats;

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

}
