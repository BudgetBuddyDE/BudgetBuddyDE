import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import React from 'react';
import {ChartsShowcase} from '@/components/ChartsShowcase/ChartsShowcase';
import {getAppTranslations} from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return {
    title: `${t('Charts')} | Budget Buddy`,
    description: t('Recharts chart gallery for financial data.'),
  };
}

export default function ChartsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ChartsShowcase />;
}
