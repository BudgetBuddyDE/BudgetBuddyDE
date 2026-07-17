import type {Metadata} from 'next';
import {Attachments} from '@/components/attachments';

export const metadata: Metadata = {title: 'Attachments'};
export default function AttachmentsPage() {
  return <Attachments />;
}
