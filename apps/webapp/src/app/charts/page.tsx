import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import React from 'react';
import {ChartsShowcase} from '@/components/ChartsShowcase/ChartsShowcase';
import {getAppTranslations} from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return {
    title: `${t('charts.charts')} | Budget Buddy`,
    description: t('charts.rechartsChartGalleryForFinancialData'),
  };
}

export default function ChartsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ChartsShowcase />;
}
