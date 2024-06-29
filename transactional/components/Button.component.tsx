import {Button, Section, type SectionProps} from '@react-email/components';
import React from 'react';

export const StyledButton: React.FC<
  Readonly<Omit<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, 'ref'>>
> = ({children, ...props}) => (
  <Button style={buttonStyle} {...props}>
    {children}
  </Button>
);

export const buttonStyle = {
  backgroundColor: '#151936',
  borderRadius: '8px',
  padding: '.7rem',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
};

export const ButtonContainer: React.FC<SectionProps> = ({children, ...props}) => (
  <Section style={{textAlign: 'center'}}>{children}</Section>
);
