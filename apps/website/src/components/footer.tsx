import Link from 'next/link';

import {config} from '@/config';

export const Footer = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} {config.brand}
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link href="/tos" className="text-xs hover:underline underline-offset-4" prefetch={false}>
          Terms of Service
        </Link>
        <Link href="/privacy-policy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
          Privacy Policy
        </Link>
        <Link
          href={config.github}
          target="_blank"
          className="text-xs hover:underline underline-offset-4"
          prefetch={false}>
          GitHub
        </Link>
      </nav>
    </footer>
  );
};
