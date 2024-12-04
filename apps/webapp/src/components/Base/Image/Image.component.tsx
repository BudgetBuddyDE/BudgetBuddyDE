import {styled} from '@mui/material';

export const Image = styled('img')(({theme}) => ({
  borderRadius: `${theme.shape.borderRadius}px`,
}));
