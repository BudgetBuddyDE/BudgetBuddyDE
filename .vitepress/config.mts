import { withMermaid } from 'vitepress-plugin-mermaid';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  base: '/',
  title: 'Budget Buddy',
  titleTemplate: 'Budget Buddy - :title',
  description: 'Budget Buddy Documentation',
  head:
    process.env.NODE_ENV === 'production'
      ? [
          [
            'script',
            {
              src: 'https://analytics.tools.tklein.it/script.js',
              'data-website-id': 'abbbacbd-1b92-4198-9301-0922650b2780',
            },
          ],
        ]
      : undefined,
  srcExclude: ['**/drawio/**'],
  themeConfig: {
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/BudgetBuddyDE/Documentation/edit/main/:path',
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Website', link: 'https://budget-buddy.de' },
      { text: 'Status', link: 'https://monitor.tools.tklein.it/status/budget-buddy' },
    ],
    sidebar: [
      {
        text: 'Quickstart',
        collapsed: false,
        items: [
          { text: 'Getting started', link: '/docs/quickstart/getting-started' },
          { text: 'Infrastructure', link: '/docs/quickstart/infrastructure' },
          { text: 'Deploy', link: '/docs/quickstart/deploy' },
        ],
      },
      {
        text: 'Services',
        collapsed: false,
        items: [
          { text: 'Webapp', link: '/docs/services/webapp' },
          { text: 'Pocketbase', link: '/docs/services/pocketbase' },
          { text: 'Types', link: '/docs/services/types' },
          { text: 'Stock-Service', link: '/docs/services/stock-service' },
          { text: 'Subscription-Service', link: '/docs/services/subscription-service' },
          { text: 'Mail-Service', link: '/docs/services/mail-service' },
          // { text: 'AI-Assistant-Service', link: '/docs/services/ai-assistant-service' },
          // { text: 'OCR', link: '/docs/services/ocr-service' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/BudgetBuddyDE' }],
    logo: 'https://app.budget-buddy.de/logo.png',
    footer: {
      copyright: `© ${new Date().getFullYear()} Budget Buddy`,
    },
  },
});
