import {Container, type ContainerProps} from '@react-email/components';
import React from 'react';

export const StyledContainer: React.FC<React.PropsWithChildren<ContainerProps>> = ({children, ...props}) => (
  <Container style={containerStyle} {...props}>
    {children}
  </Container>
);

export const containerStyle = {
  margin: '0 auto',
  borderRadius: '8px',
  border: '1px solid #dadce0',
  backgroundColor: '#fff',
};
