'use client';
import {CheckCircle2} from 'lucide-react';
import Link from 'next/link';
import {BrandLogo} from '@/components/brand-logo';
import {useI18n} from '@/lib/i18n';

export function AccountStatus({title, description}: {title: string; description: string}) {
  const {t} = useI18n();
  return (
    <div className="status-page">
      <Link href="/sign-in" className="status-brand">
        <BrandLogo compact alt="" />
      </Link>
      <div className="status-card">
        <span className="status-success">
          <CheckCircle2 size={26} />
        </span>
        <p className="eyebrow">{t('accountStatus.update')}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button-primary button-md" href="/sign-in">
          {t('accountStatus.continue')}
        </Link>
      </div>
    </div>
  );
}
