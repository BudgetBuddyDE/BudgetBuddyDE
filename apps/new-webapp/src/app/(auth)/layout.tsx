import type {ReactNode} from 'react';

export default function AuthLayout({children}: {children: ReactNode}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">BudgetBuddy</p>
          <p className="mt-1 text-sm text-muted-foreground">Your calm personal finance workspace.</p>
        </header>
        {children}
      </section>
    </main>
  );
}
