import {Text} from '@react-email/components';
import React from 'react';

import {Formatter} from '../utils';

export const NumBox: React.FC<{label: string; value: number; style?: React.CSSProperties}> = ({
  label,
  value,
  style,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#f6f9fc',
        margin: '.5rem',
        borderRadius: '8px',
        padding: '.75rem',
        paddingTop: '.5rem',
        paddingBottom: '.5rem',
        ...style,
      }}>
      <Text style={{fontWeight: 'bold', margin: 0}}>{label}</Text>
      <Text style={{fontSize: '1.3rem', margin: 0}}>{Formatter.currency(value)}</Text>
    </div>
  );
};
