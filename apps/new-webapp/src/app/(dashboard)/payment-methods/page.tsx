import type {Metadata} from 'next';
import {EntityWorkspace} from '@/components/entity-workspace';

export const metadata: Metadata = {title: 'Payment methods'};
export default function PaymentMethodsPage() {
  return <EntityWorkspace kind="payment-methods" />;
}
