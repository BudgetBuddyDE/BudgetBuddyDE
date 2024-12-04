import {HomeRounded as HomeRoundedIcon} from '@mui/icons-material';
import {Button, type ButtonProps} from '@mui/material';

export type StackedIconButtonProps = Omit<ButtonProps, 'endIcon'>;

export const StackedIconButton: React.FC<StackedIconButtonProps> = ({
  startIcon = <HomeRoundedIcon fontSize="medium" />,
  ...buttonProps
}) => {
  return <Button fullWidth {...buttonProps} startIcon={startIcon} />;
};
