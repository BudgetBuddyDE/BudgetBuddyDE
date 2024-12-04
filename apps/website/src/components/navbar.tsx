'use client';

import {ChevronRightIcon, MenuIcon, PiggyBank} from 'lucide-react';
import Link from 'next/link';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {config} from '@/config';

import {ToggleTheme} from './toggle-theme';
import {Button} from './ui/button';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from './ui/collapsible';
import {Sheet, SheetContent, SheetTrigger} from './ui/sheet';

const links = [
  {name: 'App', href: config.app},
  {name: 'Github', href: config.github},
];

const resources = [{name: 'Documentation', href: 'https://docs.budget-buddy.de', description: ''}];

export const Navbar = () => {
  return (
    <header className="flex w-full shrink-0 items-center px-4 md:px-6 py-2 border-b sticky top-0 bg-background z-50">
      <div className="lg:flex">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <PiggyBank className="h-6 w-6" />
          <span className="text-lg font-semibold">{config.brand}</span>
        </Link>
      </div>
      <nav className="ml-auto hidden lg:flex">
        <NavigationMenu>
          <NavigationMenuList>
            {links.map(({name, href}) => (
              <NavigationMenuLink key={name.toLowerCase()} asChild>
                <Link
                  key={name.toLowerCase()}
                  href={href}
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                  prefetch={false}>
                  {name}
                </Link>
              </NavigationMenuLink>
            ))}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[300px] p-2">
                  {resources.map(({name, href, description}) => (
                    <NavigationMenuLink key={name.toLowerCase()} asChild>
                      <Link
                        href={href}
                        className="group grid h-auto w-full items-center justify-start gap-1 rounded-md bg-white p-4 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                        prefetch={false}>
                        <div className="text-sm font-medium leading-none">{name}</div>
                        <div className="line-clamp-2 text-sm leading-snug text-gray-500 dark:text-gray-400">
                          {description}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuLink asChild>
              <ToggleTheme />
            </NavigationMenuLink>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden ml-auto">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <Link href="#" className="flex items-center gap-2" prefetch={false}>
            <PiggyBank className="h-6 w-6" />
            <span className="text-lg font-semibold">{config.brand}</span>
          </Link>
          <div className="grid gap-4 py-6">
            {links.map(({name, href}) => (
              <Link
                key={'mobile-' + name.toLowerCase()}
                href={href}
                className="flex w-full items-center py-2 text-lg font-semibold"
                prefetch={false}>
                {name}
              </Link>
            ))}

            <Collapsible className="grid gap-4">
              <CollapsibleTrigger className="flex w-full items-center text-lg font-semibold [&[data-state=open]>svg]:rotate-90">
                Resources
                <ChevronRightIcon className="ml-auto h-5 w-5 transition-all" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="-mx-6 grid gap-6 bg-gray-100 p-6 dark:bg-gray-800">
                  {resources.map(({name, href, description}) => (
                    <Link
                      key={'mobile-resources-' + name.toLowerCase()}
                      href={href}
                      className="group grid h-auto w-full justify-start gap-1"
                      prefetch={false}>
                      <div className="text-sm font-medium leading-none">{name}</div>
                      <div className="line-clamp-2 text-sm leading-snug text-gray-500 dark:text-gray-400">
                        {description}
                      </div>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <ToggleTheme />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
