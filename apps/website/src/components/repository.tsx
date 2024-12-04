import {CircleIcon, GitForkIcon, StarIcon} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {type TRepository} from '@/types';

export type RepositoryProps = TRepository;

export const Repository: React.FC<RepositoryProps> = async ({
  name,
  description,
  stargazers_count,
  forks_count,
  language,
  html_url,
}) => {
  return (
    <Link href={html_url}>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>{name}</CardTitle>
            <CardDescription>{description ?? 'No description'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex space-x-4 text-sm text-muted-foreground">
            {language && (
              <div className="flex items-center">
                <CircleIcon className="mr-1 h-3 w-3 fill-sky-400 text-sky-400" />
                {language}
              </div>
            )}
            <div className="flex items-center">
              <StarIcon className="mr-1 h-3 w-3" />
              {stargazers_count}
            </div>

            <div className="flex items-center">
              <GitForkIcon className="mr-1 h-3 w-3" />
              {forks_count}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
