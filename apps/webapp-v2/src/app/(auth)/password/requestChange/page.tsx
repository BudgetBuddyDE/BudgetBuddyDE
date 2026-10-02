import {redirect} from 'next/navigation';

export default function LegacyRequestPasswordChangePage() {
  redirect('/password/request-reset');
}
