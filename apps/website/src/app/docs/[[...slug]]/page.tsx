import { source } from '@/lib/source';
import { Wrapper } from '@/components/wrapper';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Callout } from 'fumadocs-ui/components/callout';
import { GithubInfo } from 'fumadocs-ui/components/github-info';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Accordions, Accordion } from 'fumadocs-ui/components/accordion';
import { AlbumIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{
        style: 'clerk',
        single: false,
      }}
      editOnGithub={{
        repo: 'BudgetBuddyDE',
        owner: 'BudgetBuddyDE',
        sha: 'main',
        path: `apps/new-website/content/docs/${page.file.path}`,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={{
            ...defaultMdxComponents,
            // this allows you to link to other pages with relative file paths
            AlbumIcon,
            Accordions,
            Accordion,
            Step,
            Steps,
            Callout,
            GithubInfo,
            File,
            Folder,
            Files,
            Card,
            Cards,
            Tab,
            Tabs,
            Wrapper,
            TypeTable,
            a: createRelativeLink(source, page),
            img: (props) => (
              <Wrapper>
                <ImageZoom
                  /* eslint-disable  @typescript-eslint/no-explicit-any */
                  {...(props as any)}
                  className={cn('mb-0 mt-0 rounded-sm', props.className)}
                />
              </Wrapper>
            ),
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
