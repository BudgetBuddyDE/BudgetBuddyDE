import React from 'react';
import { Skeleton, type SkeletonProps } from '@mui/material';

export type PaginationLoaderProps = SkeletonProps;

export const PaginationLoader: React.FC<PaginationLoaderProps> = (props) => {
  return (
    <Skeleton
      variant="rounded"
      {...props}
      sx={{ width: '30%', height: '3rem', ml: 'auto', ...props.sx }}
    />
  );
};
