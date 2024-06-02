import {GithubIcon, SmartphoneIcon} from 'lucide-react';
import Link from 'next/link';

import {config} from '@/config';

export const Hero = () => {
  return (
    <section className="border-b">
      <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
        <div className="container flex flex-col items-center space-y-4 px-0 text-center">
          <div className="py-8">
            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 mx-auto text-sm dark:bg-gray-800">
              Self hostable
            </div>
            <h1 className="max-w-[900px] mb-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Take Control of Your Finances with Budget Buddy
            </h1>
            <p className="mx-auto max-w-[850px] text-gray-500 md:text-xl dark:text-gray-400">
              Budget Buddy helps you keep track of your finances and manage your monthly budget. Track transactions, set
              budgets, and gain valuable insights. Automate recurring payments and track your stock positions—all in a
              self-hostable solution for full control and privacy.
            </p>
          </div>
          <div className="space-x-4">
            <Link
              href={config.app}
              target="_blank"
              className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              prefetch={false}>
              <SmartphoneIcon className="w-5 mr-1" /> Get Started
            </Link>

            <Link
              href={config.github}
              target="_blank"
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
              prefetch={false}>
              <GithubIcon className="w-5 mr-1" /> Github
            </Link>
          </div>
        </div>

        <img
          src="/desktop-mock.png"
          width="1270"
          height="300"
          alt="Hero"
          className="mx-auto aspect-[5/2] overflow-hidden rounded-t-xl object-cover object-top"
        />
      </div>
    </section>
  );

  return (
    <section className="w-full pt-12 md:pt-24 lg:pt-32 border-b">
      <div className="px-4 md:px-6 space-y-10 xl:space-y-16">
        <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
              Revolutionize Hiring with Blockchain
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Our blockchain-based hiring platform ensures secure, transparent, and tamper-proof candidate verification.
              Empower your business with the power of decentralized technology.
            </p>
            <div className="space-x-4 mt-6">
              <Link
                href="#"
                className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                prefetch={false}>
                Post a Job
              </Link>
              <Link
                href="#"
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                prefetch={false}>
                Find Candidates
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-start space-y-4">
            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
              Blockchain-powered Hiring
            </div>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Our platform leverages blockchain technology to provide a secure, transparent, and tamper-proof hiring
              process. Verify candidate credentials, track job applications, and manage the entire hiring lifecycle on
              the blockchain.
            </p>
          </div>
        </div>
        <img
          src="/desktop-mock.png"
          width="1270"
          height="300"
          alt="Hero"
          className="mx-auto aspect-[3/1] overflow-hidden rounded-t-xl object-cover object-top"
        />
      </div>
    </section>
  );
};
