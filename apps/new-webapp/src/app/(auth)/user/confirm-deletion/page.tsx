'use client';
import {AccountStatus} from '@/components/account-status';
import {useI18n} from '@/lib/i18n';
export default function DeletionConfirmedPage() {
  const {t} = useI18n();
  return (
    <AccountStatus
      title={t('accountStatus.deletionConfirmed')}
      description={t('accountStatus.deletionConfirmedDescription')}
    />
  );
}
