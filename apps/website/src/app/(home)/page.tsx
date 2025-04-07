import {
  CalendarSyncIcon,
  ChartCandlestickIcon,
  ChartLineIcon,
  ChartPieIcon,
  CloudUploadIcon,
  type LucideIcon,
  BanknoteIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import Image from 'next/image';

export default function Page() {
  // const gridColor = 'color-mix(in oklab, var(--color-fd-primary) 10%, transparent)';

  return (
    <>
      {/* <div
        className="absolute inset-x-0 top-[360px] h-[250px] max-md:hidden"
        // className="absolute inset-0 max-md:hidden"
        style={{
          background: `repeating-linear-gradient(to right, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px), repeating-linear-gradient(to bottom, ${gridColor}, ${gridColor} 1px,transparent 1px,transparent 50px)`,
        }}
      /> */}
      <main className="container relative max-w-[1100px] px-2 py-4 z-[2] lg:py-8">
        <div
          style={{
            background:
              'repeating-linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-fd-primary) 1%, transparent) 500px, transparent 1000px)',
          }}
        >
          <div className="relative">
            <Hero />
          </div>
          <Features />
          <SelfHostable />
        </div>
      </main>
    </>
  );
}

const SelfHostable = () => {
  return (
    <div className="flex flex-col gap-4 border-x border-t border-b px-8 py-10 md:py-18 lg:flex-row md:px-12">
      <div className="shrink-0 flex-1 text-start">
        <p className="px-2 py-1 text-sm font-mono bg-fd-primary text-fd-primary-foreground font-bold w-fit mb-4">
          Self Hostable
        </p>

        <h2 className="text-xl font-semibold mb-4 sm:text-2xl">Privacy First with Self-Hosting</h2>
        <p className="text-fd-muted-foreground mb-6">
          With Budget Buddy, you can self-host the app on your own server for full control over your
          financial data. This ensures maximum privacy, data ownership, and flexibility. Keep your
          finances truly yours — no third parties involved.
        </p>
        <div className="flex flex-row items-center font-mono -mx-4">
          <Link
            href="/docs/introduction/deployment"
            className={cn(buttonVariants({ variant: 'link' }))}
          >
            Learn more at &apos;Deployment&apos;
          </Link>
        </div>
      </div>
      <div className="md:-mt-20 ms-auto w-full max-w-[450px] invert dark:invert-0"></div>
    </div>
  );
};

const APP_FEATURES: FeatureProps[] = [
  {
    icon: BanknoteIcon,
    heading: 'Transaction Tracking',
    children:
      'Keep a detailed record of all your financial transactions in one place. Easily categorize and review your spending habits to stay on top of your finances.',
  },
  {
    icon: ChartPieIcon,
    heading: 'Budget Management',
    children:
      'Set and manage monthly budgets to ensure you live within your means. Get alerts and insights to help you stick to your financial goals and make informed spending decisions.',
  },
  {
    icon: ChartLineIcon,
    heading: 'Insights',
    children:
      'Gain valuable insights based on your transaction history, helping you understand your financial health. Use insights to make better financial decisions and plan for the future.',
  },
  {
    icon: CalendarSyncIcon,
    heading: 'Recurring Payments',
    children:
      'Add recurring payments to automate monthly transactions for bills and subscriptions. This feature saves you time and ensures you never miss a payment.',
  },
  {
    icon: ChartCandlestickIcon,
    heading: 'Stock Tracking',
    children:
      'Monitor your stock positions with detailed information on dividends and financial performance. Stay informed about your investments and make strategic decisions to maximize returns.',
  },
  {
    icon: CloudUploadIcon,
    heading: 'File Uploads',
    children:
      'Upload files related to your transactions, such as receipts and invoices. This feature helps you keep all your financial documents organized and easily accessible.',
  },
];

const Features = () => {
  return (
    <div className="grid grid-cols-1 border-r md:grid-cols-2 lg:grid-cols-3">
      <div className="col-span-full flex flex-row items-start justify-center border-l border-t p-8 text-center">
        <h2 className="bg-fd-primary text-fd-primary-foreground px-1 text-2xl font-semibold">
          Features
        </h2>
      </div>
      {APP_FEATURES.map((feature, idx) => (
        <Feature key={'feature-' + idx} icon={feature.icon} heading={feature.heading}>
          {feature.children}
        </Feature>
      ))}
    </div>
  );
};

type FeatureProps = {
  icon: LucideIcon;
  heading: ReactNode;
  children: ReactNode;
};

const Feature: React.FC<FeatureProps> = ({ icon: Icon, heading, children }) => {
  return (
    <div className="border-l border-t px-6 py-12">
      <div className="mb-4 flex flex-row items-center gap-2 text-fd-muted-foreground">
        <Icon className="size-4" />
        <h2 className="text-sm font-medium">{heading}</h2>
      </div>
      <span className="font-medium">{children}</span>
    </div>
  );
};

const Hero = () => {
  return (
    <div className="relative z-[2] flex flex-col border-x border-t bg-fd-card/80 px-6 pt-12 max-md:text-center md:px-12 md:pt-16 max-lg:overflow-hidden">
      <h1 className="mb-8 max-w-[600px] text-4xl font-medium">Take Control of Your Finances</h1>
      <p className="mb-8 text-fd-muted-foreground md:max-w-[80%] md:text-xl">
        Budget Buddy helps you keep track of your finances and manage your monthly budget. Track
        transactions, set budgets, and gain valuable insights. Automate recurring payments and track
        your stock positions—all in a self-hostable solution for full control and privacy.
      </p>
      <div className="inline-flex items-center gap-3 max-md:mx-auto">
        <a
          href="https://app.budget-buddy.de"
          target="_blank"
          className={cn(buttonVariants({ size: 'lg', className: 'rounded-full' }))}
        >
          Getting Started
        </a>
        <Link
          href="/docs"
          rel="noreferrer noopener"
          className={cn(
            buttonVariants({
              size: 'lg',
              variant: 'outline',
              className: 'rounded-full bg-fd-background',
            })
          )}
        >
          Open Docs
        </Link>
      </div>
      <div className="mt-12 -mb-10 lg:-mb-18 w-full mx-auto mx-auto">
        <Image
          src={'/desktop-mock.png'}
          alt="preview"
          priority
          width={1600}
          height={900}
          className={cn(
            'w-full select-none duration-1000 animate-in fade-in slide-in-from-bottom-12 dark:[mask-image:linear-gradient(to_bottom,white_70%,transparent_90%)]'
          )}
        />
      </div>
    </div>
  );
};
