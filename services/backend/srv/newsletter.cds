using de.budgetbuddy as my from '../db/schema';

@path : '/service/newsletter'
@title: 'Newsletter Service'
service NewsletterService {
  @plural: 'Users'
  entity User @(restrict: [{
    grant: ['READ'],
    where: 'userId = $user'
  }, ]) as projection on my.User;

  @plural: 'Newsletters'
  entity Newsletter @(restrict: [
    {
      grant: [
        'CREATE',
        'UPDATE',
        'DELETE'
      ],
      to   : ['Admin']
    },
    {grant: ['READ']
                    // where: 'enabled = true'
            }
  ])    as projection on my.Newsletter;

  @plural: 'NewsletterSubscriptions'
  entity NewsletterSubscription @(restrict: [{
    grant: [
      'CREATE',
      'READ',
      ' UPDATE',
      'DELETE'
    ],
    where: 'owner = $user',
  }])   as projection on my.NewsletterSubscription;
}
