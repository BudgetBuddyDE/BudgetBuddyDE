import {CheckCircle2} from 'lucide-react';
import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';

export function ConfirmationView({
  title,
  description,
  href = '/dashboard',
  action = 'Continue',
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="text-center">
      <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-success" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link className={`${buttonVariants()} mt-6`} href={href}>
        {action}
      </Link>
    </div>
  );
}
