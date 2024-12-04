import {HomeRounded as HomeRoundedIcon} from '@mui/icons-material';
import {render} from '@testing-library/react';

import {StackedIconButton} from './StackedIconButton.component';

describe('StackedIconButton', () => {
  it('renders with default startIcon', () => {
    const {getByRole} = render(<StackedIconButton />);
    const button = getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with provided startIcon', () => {
    const {getByRole} = render(<StackedIconButton startIcon={<HomeRoundedIcon fontSize="large" />} />);
    const button = getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('passes additional props to Button', () => {
    const {getByRole} = render(<StackedIconButton color="primary" />);
    const button = getByRole('button');
    expect(button).toHaveClass('MuiButton-colorPrimary');
  });

  it('renders with fullWidth prop', () => {
    const {getByRole} = render(<StackedIconButton />);
    const button = getByRole('button');
    expect(button).toHaveClass('MuiButton-fullWidth');
  });
});
