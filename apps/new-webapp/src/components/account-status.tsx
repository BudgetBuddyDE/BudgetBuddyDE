import {CheckCircle2, Gauge} from 'lucide-react';
import Link from 'next/link';

export function AccountStatus({title, description}: {title: string; description: string}) {
  return (
    <div className="status-page">
      <Link href="/sign-in" className="status-brand">
        <Gauge size={21} /> BudgetBuddy
      </Link>
      <div className="status-card">
        <span className="status-success">
          <CheckCircle2 size={26} />
        </span>
        <p className="eyebrow">Account update</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button-primary button-md" href="/sign-in">
          Continue to sign in
        </Link>
      </div>
    </div>
  );
}
