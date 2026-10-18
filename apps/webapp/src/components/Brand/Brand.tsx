'use client';

import {Link, Stack, Typography, type StackProps, type TypographyProps} from '@mui/material';
import NextLink from 'next/link';
import type React from 'react';
import {AppLogo} from '@/components/AppLogo/AppLogo';
import type {ImageComponentProps} from '@/components/Image';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type TBrandProps = {
  showTitle?: boolean;
  logoSize?: number;
  boxStyle?: StackProps['sx'];
  logoStyle?: ImageComponentProps['sx'];
  typographyStyle?: TypographyProps['sx'];
  asLink?: boolean;
};

export const Brand: React.FC<TBrandProps> = ({
  showTitle = false,
  logoSize = 36,
  boxStyle,
  logoStyle,
  typographyStyle,
  asLink = false,
}) => {
  const t = useAppTranslations();
  const content = (
    <Stack direction="row" sx={{alignItems: 'center', gap: 1.5, minWidth: 0, ...boxStyle}}>
      <AppLogo
        alt={showTitle ? '' : t('common.budgetbuddydeLogo')}
        width={logoSize}
        height={logoSize}
        loading="eager"
        sx={{width: logoSize, height: logoSize, flex: '0 0 auto', ...logoStyle}}
      />
      {showTitle && (
        <Typography
          component="span"
          variant="h5"
          noWrap
          sx={{fontWeight: 700, color: 'inherit', textDecoration: 'none', ...typographyStyle}}
        >
          BudgetBuddyDE
        </Typography>
      )}
    </Stack>
  );

  return asLink ? (
    <Link component={NextLink} href="/" underline="none" color="inherit" sx={{display: 'inline-flex'}}>
      {content}
    </Link>
  ) : (
    content
  );
};
