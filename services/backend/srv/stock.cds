using de.budgetbuddy as my from '../db/schema';

@path : '/service/security'
@title: 'Security Service'
service SecurityService {
  @plural: 'Users'
  entity User @(restrict: [{
    grant: ['READ'],
    where: 'userId = $user'
  }, ])                                                      as projection on my.User;

  @plural: 'StockExchanges'
  entity StockExchange @(restriction: [{grant: ['READ']}, ]) as projection on my.StockExchange;

  @plural: 'StockWatchlists'
  entity StockWatchlist @(restriction: [{
    grant: ['*'],
    where: 'owner = $user'
  }, ])                                                      as projection on my.StockWatchlist;

  @plural: 'StockPositions'
  entity StockPosition @(restriction: [{
    grant: ['*'],
    where: 'owner = $user'
  }, ])                                                      as projection on my.StockPosition;
}
