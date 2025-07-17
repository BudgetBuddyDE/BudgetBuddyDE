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

  @readonly
  view CategoryExpenses as
    select from db.Category {
      ID,
      name,
      description,
      createdBy,
      (
        select sum(transferAmount) from Transaction
        where
              toCategory.ID  =  Category.ID
          and transferAmount >= 0
      ) as income,
      coalesce(
        (
          select sum(abs(transferAmount)) from db.Transaction
          where
                toCategory.ID  = Category.ID
            and transferAmount < 0
        ), 0
      ) as expenses : Double,
    };

}
