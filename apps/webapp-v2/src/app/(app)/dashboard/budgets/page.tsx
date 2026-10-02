import {dashboardTabs} from '@/app/(app)/pageTabs';
import {PageHeader} from '@/compositions/PageHeader/PageHeader';

export default function BudgetsPage() {
  return <PageHeader title="Budgets" tabs={dashboardTabs} />;
}
