import Image from 'next/image';
import {cn} from '@/utils/cn';

const AVATAR_PIXELS = {sm: 34, md: 35, lg: 52} as const;

type AvatarSize = keyof typeof AVATAR_PIXELS;

export function Avatar({
  name,
  image,
  size = 'md',
  className,
}: {
  name: string;
  image?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const label = `${name} avatar`;
  const initial = name.trim().charAt(0).toLocaleUpperCase() || 'U';
  const pixels = AVATAR_PIXELS[size];

  return (
    <span className={cn('avatar', `avatar-${size}`, className)} aria-label={label} role="img">
      {image ? <Image src={image} alt="" width={pixels} height={pixels} unoptimized /> : initial}
    </span>
  );
}
