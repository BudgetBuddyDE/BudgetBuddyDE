import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {DismissableAlert} from './DismissableAlert';

describe('DismissableAlert', () => {
  it('hides its content when dismissed', async () => {
    render(<DismissableAlert>Highlights</DismissableAlert>);

    expect(screen.getByText('Highlights')).toBeInTheDocument();
    const collapse = screen.getByRole('alert').closest<HTMLElement>('.MuiCollapse-root');
    expect(collapse).not.toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'close'}));

    await waitFor(() => expect(collapse).toHaveClass('MuiCollapse-hidden'));
  });
});
