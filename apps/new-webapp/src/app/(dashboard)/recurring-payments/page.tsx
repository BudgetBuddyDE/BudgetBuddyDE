import type {Metadata} from 'next';
import {EntityWorkspace} from '@/components/entity-workspace';

export const metadata: Metadata = {title: 'Recurring payments'};
export default function RecurringPaymentsPage() {
  return <EntityWorkspace kind="recurring" />;
}
