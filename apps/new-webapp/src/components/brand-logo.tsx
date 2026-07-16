import Image from 'next/image';
import {cn} from '@/utils/cn';

export function BrandLogo({
  compact = false,
  onDark = false,
  className,
  alt = 'BudgetBuddy',
}: {
  compact?: boolean;
  onDark?: boolean;
  className?: string;
  alt?: string;
}) {
  if (compact) {
    return (
      <Image
        className={cn('brand-logo brand-logo-mark', className)}
        src="/brand/mark.svg"
        width={48}
        height={48}
        alt={alt}
        priority
      />
    );
  }
  return (
    <span className={cn('brand-logo brand-logo-full', onDark && 'brand-logo-on-dark', className)}>
      <Image className="brand-logo-light" src="/brand/logo-light.svg" width={250} height={48} alt={alt} priority />
      <Image className="brand-logo-dark" src="/brand/logo-dark.svg" width={250} height={48} alt={alt} priority />
    </span>
  );
}
