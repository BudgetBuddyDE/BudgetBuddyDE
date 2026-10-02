import {settingsTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function ApiKeysPage() {
  return <PageHeader title="Api Keys" tabs={settingsTabs} />;
}
