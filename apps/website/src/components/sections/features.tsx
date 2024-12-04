const features = [
  {
    heading: 'Transaction Tracking',
    description:
      'Keep a detailed record of all your financial transactions in one place. Easily categorize and review your spending habits to stay on top of your finances.',
  },
  {
    heading: 'Budget Management',
    description:
      'Set and manage monthly budgets to ensure you live within your means. Get alerts and insights to help you stick to your financial goals and make informed spending decisions.',
  },
  {
    heading: 'Insights',
    description:
      'ain valuable insights based on your transaction history, helping you understand your financial health. Use insights to make better financial decisions and plan for the future.',
  },
  {
    heading: 'Recurring Payments',
    description:
      'Add recurring payments to automate monthly transactions for bills and subscriptions. This feature saves you time and ensures you never miss a payment.',
  },
  {
    heading: 'Stock Tracking',
    description:
      'Monitor your stock positions with detailed information on dividends and financial performance. Stay informed about your investments and make strategic decisions to maximize returns.',
  },
  {
    heading: 'Self-Hostable Solution',
    description:
      'Host Budget Buddy on your own server for complete control and enhanced privacy. Enjoy the flexibility and security of managing your financial data on your terms.',
  },
];

export const Features = () => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container space-y-12 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Budget-buddy offers a range of features to help you manage your finances and make informed decisions.
            </p>
          </div>
        </div>
        <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
          {features.map(feature => (
            <div key={feature.heading.replaceAll(' ', '_').toLowerCase()} className="grid gap-1">
              <h3 className="text-lg font-bold">{feature.heading}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
