import {Section, type SectionProps} from '@react-email/components';
import React from 'react';

import {StyledLink} from './StyledLink.component';

export const Footer: React.FC<SectionProps> = ({...props}) => (
  <Section style={footerStyle} {...props}>
    <StyledLink href={'https://budget-buddy.de'}>Website</StyledLink>
    <StyledLink href={'https://app.budget-buddy.de'}>App</StyledLink>
    <StyledLink href={'https://github.com/BudgetBuddyDE/'}>GitHub</StyledLink>
  </Section>
);

export const footerStyle = {
  borderTop: '1px solid #dadce0',
  padding: '1rem',
};
