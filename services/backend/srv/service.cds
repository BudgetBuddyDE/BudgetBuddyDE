using {de.budgetbuddy as db} from '../db/schema';

@restr
service BackendService {

  @plural: 'Categories'
  entity Category @(restrict: [{
    grant: [
      'READ',
      'UPDATE',
      'DELETE'
    ],
    where: 'CreatedBy = $user'
  }])                  as projection on db.Category;

  @plural: 'PaymentMethods'
  entity PaymentMethod as projection on db.PaymentMethod;

  @plural: 'Transactions'
  entity Transaction   as projection on db.Transaction;

  @plural: 'Subscriptions'
  entity Subscription  as projection on db.Subscription;

}
