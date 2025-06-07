using de.budgetbuddy as my from '../db/schema';

@path : '/service/user'
@title: 'User Service'
service UserService {
  entity User @(restrict: [
    {grant: 'CREATE'},
    {
      grant: [
        'READ',
        'UPDATE',
        'DELETE'
      ],
      to   : 'authenticated-user',
      where: 'userId = $user'
    },
  ]) as projection on my.User;
}
