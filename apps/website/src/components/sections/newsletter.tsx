'use client';

import React from 'react';

import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {useToast} from '../ui/use-toast';

export const Newsletter = () => {
  const {toast} = useToast();
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    toast({
      title: 'Subscribed to newsletter',
      description: 'Friday, February 10, 2023 at 5:57 PM',
    });
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Newsletter</h2>
          <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Subscribe to our newsletter and stay up-to-date with the latest news and updates.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-2">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="max-w-lg flex-1"
              onChange={e => setEmail(e.target.value)}
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>
    </section>
  );
};
