import {dashboardTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function DashboardPage() {
  return <PageHeader title="Dashboard" tabs={dashboardTabs} />;
}
