import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import React from 'react';
import {ChartsShowcase} from '@/components/ChartsShowcase/ChartsShowcase';

export const metadata: Metadata = {
  title: 'Charts | Budget Buddy',
  description: 'Recharts chart gallery for financial data.',
};

export default function ChartsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ChartsShowcase />;
}
