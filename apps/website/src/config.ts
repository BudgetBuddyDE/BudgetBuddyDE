export const config = {
  brand: 'Budget Buddy',
  github: 'https://github.com/BudgetBuddyDE',
  website: 'https://budget-buddy.de',
  app: 'https://app.budget-buddy.de',
  documentation: 'https://docs.budget-buddy.de',
  repos: {
    whitelist: [
      'website',
      'Webapp',
      'types',
      'Subscription-Service',
      'Mail-Service',
      'Stock-Service',
      'documentation',
    ].map(name => name.toLowerCase()),
  },
};
