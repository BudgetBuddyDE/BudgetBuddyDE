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
  - icon: 📝
    title: Focus on Your Content
    details: Effortlessly create beautiful documentation sites with just markdown.
    link: /test
  - title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
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
