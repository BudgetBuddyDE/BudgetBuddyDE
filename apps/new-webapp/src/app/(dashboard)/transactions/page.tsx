import type {Metadata} from 'next';
import {EntityWorkspace} from '@/components/entity-workspace';

export const metadata: Metadata = {title: 'Transactions'};
export default function TransactionsPage() {
  return <EntityWorkspace kind="transactions" />;
}
