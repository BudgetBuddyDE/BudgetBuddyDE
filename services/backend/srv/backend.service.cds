using {de.budgetbuddy as db} from '../db/schema';

@protocol: ['odata',
// 'rest',
]
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
  }])               as projection on db.Category;

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

  @readonly
  view Receiver_VH @(restrict: [{
    grant: ['READ'],
    where: 'owner = $user'
  }]) as
      select from Transaction {
        key receiver,
            owner
      }
    union
      select from Subscription {
        key receiver,
            owner
      }

  @plural                : 'Budgets'
  @cds.redirection.target: 'Budget'
  entity Budget     as
    projection on db.Budget {
      *,
      coalesce(
        (
          select sum(t.transferAmount) * -1 from db.Transaction as t
          where
                t.owner                           = Budget.owner
            // FIXME: Re-enable filtering by current month/year when needed
            and EXTRACT(month from t.processedAt) = EXTRACT(month from current_date)
            and EXTRACT(year from t.processedAt)  = EXTRACT(year from current_date)
            and (
              (
                Budget.type                       = 'i'
                and exists(
                  select from db.Budget.toCategories as bc
                  where
                    bc.toCategory.ID = t.toCategory.ID
                )
              )
              or (
                Budget.type                       = 'e'
                and not exists(
                  select from db.Budget.toCategories as bc
                  where
                    bc.toCategory.ID = t.toCategory.ID
                )
              )
            )
        ), 0
      ) as balance : type of db.Transaction : transferAmount
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
  }])               as projection on db.PaymentMethod;

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
  }])               as projection on db.Transaction
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
  }])               as projection on db.Subscription
                       order by
                         executeAt asc;


  @plural: 'CategoryStats'
  view CategoryStats as select from db.CategoryStats;

  @plural: 'MonthlyKPIs'
  entity MonthlyKPI as projection on db.MonthlyKPI;
}
