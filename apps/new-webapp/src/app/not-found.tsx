'use client';
import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {BrandLogo} from '@/components/brand-logo';
import {useI18n} from '@/lib/i18n';
export default function NotFound() {
  const {t} = useI18n();
  return (
    <main className="status-page">
      <Link href="/dashboard" className="status-brand">
        <BrandLogo compact alt="" />
      </Link>
      <div className="status-card">
        <p className="eyebrow">{t('notFound.eyebrow')}</p>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.description')}</p>
        <Link className="button button-primary button-md" href="/dashboard">
          <ArrowLeft size={16} /> {t('notFound.back')}
        </Link>
      </div>
    </main>
  );
}
