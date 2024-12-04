import {CookieRounded} from '@mui/icons-material';
import {Box, Button, Fade, Paper, type PaperProps, Stack, Typography} from '@mui/material';
import TrapFocus from '@mui/material/Unstable_TrapFocus';
import React from 'react';
import Cookies from 'universal-cookie';

import {AppConfig} from '@/app.config';

import {Icon} from '../Icon/Icon.component';

export type TCookieDisclaimerProps = {
  cookieName?: string;
  paperProps?: PaperProps;
};

/**
 * Renders a cookie disclaimer component.
 *
 * @component
 * @example
 * ```tsx
 * <CookieDisclaimer cookieName="bb:cookies" paperProps={{ elevation: 3 }} />
 * ```
 *
 * @param {Object} props - The component props.
 * @param {string} [props.cookieName='bb:cookies'] - The name of the cookie to check for acceptance.
 * @param {Object} [props.paperProps] - Additional props to be spread to the Paper component.
 * @returns {JSX.Element | null} The rendered CookieDisclaimer component.
 */
export const CookieDisclaimer: React.FC<TCookieDisclaimerProps> = ({cookieName = 'bb:cookies', paperProps}) => {
  const cookies = new Cookies(null, {path: '/'});
  const [showDisclaimer, setShowDisclaimer] = React.useState(false);

  const handleCookieAccept = () => {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 100); // Set the expiration date to 100 years in the future
    cookies.set(cookieName, 'true', {path: '/', expires: expirationDate});
    setShowDisclaimer(false);
  };

  React.useEffect(() => {
    const ck = cookies.get(cookieName);

    setShowDisclaimer(!ck && ck !== true);
  }, [cookieName]);

  if (!showDisclaimer) return null;
  return (
    <TrapFocus open disableAutoFocus disableEnforceFocus>
      <Fade appear={false} in={showDisclaimer}>
        <Paper
          role="dialog"
          square
          variant="outlined"
          tabIndex={-1}
          {...paperProps}
          sx={{
            zIndex: 100,
            position: 'sticky',
            bottom: 0,
            width: '100%',
            p: 2,
            borderTopWidth: '1px',
            borderTopColor: 'divider',
            ...paperProps?.sx,
          }}>
          <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={AppConfig.baseSpacing}>
            <Stack
              direction={'row'}
              alignItems={'center'}
              justifyContent={'center'}
              columnGap={AppConfig.baseSpacing / 2}>
              <Box>
                <Icon icon={<CookieRounded />} />
              </Box>
              <Box>
                <Typography fontWeight="bold">This website uses cookies</Typography>
                <Typography variant="body2">
                  {AppConfig.appName} relies on cookies to provide this experience. We do not track you or your actions!
                </Typography>
              </Box>
            </Stack>
            <Stack gap={2} sx={{alignSelf: {xs: 'flex-end', sm: 'center'}}}>
              <Button size="small" onClick={handleCookieAccept} variant="contained">
                Accept
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Fade>
    </TrapFocus>
  );
};
