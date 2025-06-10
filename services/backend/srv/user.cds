using de.budgetbuddy as my from '../db/schema';

@path    : '/service/user'
@requires: 'authenticated-user'
@title   : 'User Service'
service UserService {
  entity User @(restrict: [
    {
      grant: 'CREATE',
      to   : 'system'
    },
    {
      grant: [
        'READ',
        'UPDATE',
        'DELETE'
      ],
      where: 'userId = $user'
    },
  ]) as projection on my.User;
}
