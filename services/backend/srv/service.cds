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

  @plural                : 'Budgets'
  @cds.redirection.target: 'Budget'
  entity Budget                                         as
    projection on db.Budget {
      *,
      (
        select sum(t.transferAmount) * -1 from db.Transaction as t
        where
              t.owner              = Budget.owner
          and month(t.processedAt) = month(current_date)
          and year(t.processedAt)  = year(current_date)
          and (
            (
              Budget.type          = 'i'
              and exists(
                select from db.Budget.toCategories as bc
                where
                  bc.toCategory.ID = t.toCategory.ID
              )
            )
            or (
              Budget.type          = 'e'
              and not exists(
                select from db.Budget.toCategories as bc
                where
                  bc.toCategory.ID = t.toCategory.ID
              )
            )
          )
      ) as balance : type of db.Transaction : transferAmount
    };

  // FIXME: The following commented-out code is not used in the current implementation.
  // It will currently break the service if uncommented.
  // Unfortunately, it is not possible to use the @Core.AutoExpand annotation righ now
  // entity TestBudget                                     as
  //   select from db.Budget {
  //     *,
  //     toCategories.{
  //       *,
  //       toCategory.{
  //         ID   as categoryId,
  //         name as categoryName
  //       }
  //     }
  //   };

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
