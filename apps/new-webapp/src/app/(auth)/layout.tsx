import {AuthVisual} from '@/components/auth-form';

export default function AuthLayout({children}: {children: React.ReactNode}) {
  return (
    <main className="auth-shell">
      <AuthVisual />
      <section className="auth-content">{children}</section>
    </main>
  );
}
