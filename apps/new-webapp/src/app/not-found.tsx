import {ArrowLeft, Gauge} from 'lucide-react';
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="status-page">
      <Link href="/dashboard" className="status-brand">
        <Gauge size={21} /> BudgetBuddy
      </Link>
      <div className="status-card">
        <p className="eyebrow">404 · Not found</p>
        <h1>This page is outside the budget.</h1>
        <p>The address may have changed or the resource is no longer available.</p>
        <Link className="button button-primary button-md" href="/dashboard">
          <ArrowLeft size={16} /> Back to overview
        </Link>
      </div>
    </main>
  );
}
