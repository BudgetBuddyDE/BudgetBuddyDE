import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-fd-card py-12 text-fd-secondary-foreground">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm">© {new Date().getFullYear()} Budget Buddy</p>
        </div>
        <div className="flex gap-4">
          <Link href="/terms-of-service" className="text-sm">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="text-sm">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};
