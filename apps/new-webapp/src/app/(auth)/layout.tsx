import {AuthVisual} from '@/components/auth-form';
import {ThemeToggle} from '@/theme/theme-provider';

export default function AuthLayout({children}: {children: React.ReactNode}) {
  return (
    <main className="auth-shell">
      <AuthVisual />
      <section className="auth-content">
        <ThemeToggle className="auth-theme-toggle" />
        {children}
      </section>
    </main>
  );
}
