import {Link, type LinkProps} from '@react-email/components';
import React from 'react';

export const StyledLink: React.FC<LinkProps> = ({...props}) => <Link style={linkStyle} {...props} />;

export const linkStyle = {
  color: 'gray',
  fontSize: '1rem',
  marginRight: '1rem',
};
