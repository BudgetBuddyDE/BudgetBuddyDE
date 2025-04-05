import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginWithGitHub, LoginWithGoogle } from '../Buttons';
import Link from 'next/link';
import { type HTMLInputTypeAttribute } from 'react';

const Fields: {
  id: string;
  type?: HTMLInputTypeAttribute;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  link?: { href: string; label: string };
}[] = [
  {
    id: 'email',
    type: 'email',
    name: 'email',
    label: 'Email',
    placeholder: 'john.doe@example.com',
    required: true,
  },
  {
    id: 'password',
    type: 'password',
    name: 'password',
    label: 'Password',
    placeholder: 'your_super_secret_password',
    required: true,
    link: { href: '#', label: 'Forgot your password?' },
  },
];

export function SignInForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google or GitHub account</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <LoginWithGoogle />
                <LoginWithGitHub />
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                {Fields.map((field) => (
                  <div key={field.id} className="grid gap-2">
                    {field.link ? (
                      <div className="flex items-center">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <a
                          href={field.link.href}
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          {field.link.label}
                        </a>
                      </div>
                    ) : (
                      <Label htmlFor={field.id}>{field.label}</Label>
                    )}
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking &apos;Login&apos;, you agree to our{' '}
        <a href="https://budget-buddy.de/tos">Terms of Service</a> and{' '}
        <a href="https://budget-buddy.de/privacy-policy">Privacy Policy</a>.
      </div>
    </div>
  );
}
