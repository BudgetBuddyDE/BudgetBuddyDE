import {Skeleton, type SkeletonProps} from '@mui/material';
import type React from 'react';

export type PaginationLoaderProps = SkeletonProps;

export const PaginationLoader: React.FC<PaginationLoaderProps> = props => {
  return <Skeleton variant="rounded" {...props} sx={{width: '30%', height: '3rem', ml: 'auto', ...props.sx}} />;
};
