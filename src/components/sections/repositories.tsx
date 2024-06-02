import {config} from '@/config';
import {type TRepository} from '@/types';

import {Repository} from '../repository';

/**
 * Fetches repositories from the GitHub API.
 * @returns A promise that resolves to an array containing the fetched data or an error.
 */
async function fetchRepositories(): Promise<[TRepository[] | null, Error | null]> {
  try {
    const response = await fetch('https://api.github.com/orgs/BudgetBuddyDE/repos');
    const data = await response.json();
    if (response.ok) {
      return [data, null];
    }
    return [null, new Error('Failed to fetch repositories')];
  } catch (error) {
    console.error(error);
    return [null, error as Error];
  }
}

export const Repositories = async () => {
  const [repos, error] = await fetchRepositories();

  if (error || !repos) {
    console.error(error);
    return null;
  }
  return (
    <section id="repositories" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Repositories</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Take a look at our public repositories on GitHub to see some of the projects we've been working on.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-6">
          {repos
            .filter(({name}) => config.repos.whitelist.includes(name.toLowerCase()))
            .map(repo => (
              <div key={repo.id} className="grid h-full">
                <Repository {...repo} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
