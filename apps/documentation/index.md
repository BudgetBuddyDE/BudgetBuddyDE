---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Budget Buddy'
  text: 'Documentation'
  tagline: Take Control of Your Finances
  actions:
    - theme: brand
      text: Get started
      link: /docs/quickstart/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/BudgetBuddyDE
  # image:
  #   src: /desktop-mock.png
  #   alt: VitePress
features:
  - title: Self-Hostable Solution
    details: Host Budget Buddy on your own server for complete control and enhanced privacy. Enjoy the flexibility and security of managing your financial data on your terms.
    link: /docs/quickstart/deploy
  - title: Recurring Payments
    details: Add recurring payments to automate monthly transactions for bills and subscriptions. This feature saves you time and ensures you never miss a payment.
    link: /docs/services/subscription-service
  - title: Stock Tracking
    details: Monitor your stock positions with detailed information on dividends and financial performance. Stay informed about your investments and make strategic decisions to maximize returns.
    link: /docs/services/stock-service
  - title: Reports
    details: Receive regular reports via mail on your investments, expenses, and income. Track your stock portfolio with daily updates on prices.
    link: /docs/services/mail-service
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
