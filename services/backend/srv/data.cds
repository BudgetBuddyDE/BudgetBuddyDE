using de.budgetbuddy as my from '../db/schema';

@path    : '/service/data'
@requires: 'authenticated-user'
@title   : 'Data Service'
service DataService {
  @plural: 'Users'
  entity User @(restrict: [{
    grant: ['READ'],
    where: 'userId = $user'
  }, ]) as projection on my.User;

  @plural: 'Categories'
  entity Category @(restrict: [{
    grant: '*',
    where: 'owner = $user'
  }])   as projection on my.Category;

  @plural: 'PaymentMethods'
  entity PaymentMethod @(restrict: [{
    grant: '*',
    where: 'owner = $user'
  }])   as projection on my.PaymentMethod;

  @plural: 'Transactions'
  entity Transaction @(restrict: [{
    grant: '*',
    where: 'owner = $user'
  }])   as projection on my.Transaction;

  @plural: 'StockWatchlists'
  entity Subscription @(restrict: [{
    grant: '*',
    where: 'owner = $user'
  }])   as projection on my.Subscription;

  @plural: 'Budgets'
  entity Budget @(restrict: [{
    grant: '*',
    where: 'owner = $user'
  }])   as projection on my.Budget;
}
