import type {Metadata} from 'next';
import {Reporting} from '@/components/reporting';

export const metadata: Metadata = {title: 'Reporting'};
export default function ReportingPage() {
  return <Reporting />;
}
