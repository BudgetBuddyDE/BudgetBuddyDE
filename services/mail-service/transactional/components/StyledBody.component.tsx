import {Body, type BodyProps} from '@react-email/components';
import React from 'react';

export const StyledBody: React.FC<React.PropsWithChildren<BodyProps>> = ({children, ...props}) => (
  <Body style={bodyStyle} {...props}>
    {children}
  </Body>
);

export const bodyStyle = {
  // backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
