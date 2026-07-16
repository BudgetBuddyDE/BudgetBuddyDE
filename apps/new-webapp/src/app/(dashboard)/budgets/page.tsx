import type {Metadata} from 'next';
import {EntityWorkspace} from '@/components/entity-workspace';

export const metadata: Metadata = {title: 'Budgets'};
export default function BudgetsPage() {
  return <EntityWorkspace kind="budgets" />;
}
