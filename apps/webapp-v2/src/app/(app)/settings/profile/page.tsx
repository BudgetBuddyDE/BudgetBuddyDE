import {settingsTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function ProfilePage() {
  return <PageHeader title="Profile" tabs={settingsTabs} />;
}
