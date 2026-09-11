import {defineConfig} from 'fumapress';
import {lucideIconsPlugin} from 'fumadocs-core/source/plugins/lucide-icons';
import {defineDocs} from 'fumadocs-mdx/macro';
import {fumadocsMdx} from 'fumapress/adapters/mdx';
import {linkValidationPlugin} from 'fumapress/plugins/link-validation';
import {robotsPlugin} from 'fumapress/plugins/robots';
import {llmsPlugin} from 'fumapress/plugins/llms.txt';
import {sitemapPlugin} from 'fumapress/plugins/sitemap';
import {takumiPlugin} from 'fumapress/plugins/takumi';

const docs = defineDocs({
  dir: 'docs',
  docs: {
    async: true,
    postprocess: {includeProcessedMarkdown: true},
  },
});

export default defineConfig({
  site: {
    name: 'BudgetBuddyDE',
    baseUrl: 'https://docs.budget-buddy.de',
    git: {
      user: 'BudgetBuddyDE',
      branch: 'main',
      repo: 'BudgetBuddyDE',
    },
  },
  mode: 'static',
  content: docs.toFumadocsSource(),
  loaderOptions: {
    plugins: [lucideIconsPlugin()],
  },
})
  .adapters(fumadocsMdx())
  .plugins(
    linkValidationPlugin(),
    llmsPlugin({routes: 'all'}),
    sitemapPlugin({path: '/sitemap.xml'}),
    robotsPlugin(),
    takumiPlugin(),
  );
