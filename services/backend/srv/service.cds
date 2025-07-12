using {de.budgetbuddy as db} from '../db/schema';

@restr
service BackendService {

  @plural: 'Categories'
  entity Category @(restrict: [{
    grant: [
      'READ',
      'CREATE',
      'UPDATE',
      'DELETE'
    ],
    where: 'createdBy = $user'
  }])                  as projection on db.Category;

  @cds.redirection.target: 'Category'
  view Category_VH as
    select from db.Category {
      ID,
      name,
      description
    };

  @plural: 'PaymentMethods'
  entity PaymentMethod as projection on db.PaymentMethod;

  @cds.redirection.target: 'PaymentMethod'
  view PaymentMethod_VH as
    select from db.PaymentMethod {
      ID,
      name,
      address,
      provider,
      description,
    };


  @plural: 'Transactions'
  entity Transaction   as projection on db.Transaction;

  @plural: 'Subscriptions'
  entity Subscription  as projection on db.Subscription;

}
