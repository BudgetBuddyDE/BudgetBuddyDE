import {Section} from '@react-email/components';
import React from 'react';

import {Footer} from './Footer.component';
import {Logo} from './Logo.component';
import {StyledContainer} from './StyledContainer.component';

export const Layout: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    <StyledContainer>
      <Section style={{padding: '1rem'}}>
        <Logo src={'https://app.budget-buddy.de/logo.png'} />
      </Section>

      <Section>{children}</Section>

      <Footer />
    </StyledContainer>
  );
};
