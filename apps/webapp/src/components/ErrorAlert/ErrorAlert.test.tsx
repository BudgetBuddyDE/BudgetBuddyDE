import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {ErrorAlert} from './ErrorAlert';

describe('ErrorAlert', () => {
  it('renders nothing when error is null', () => {
    const {container} = render(<ErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when error is undefined', () => {
    const {container} = render(<ErrorAlert error={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders error name and message when error is an Error object', () => {
    const error = new Error('Something went wrong');
    error.name = 'CustomError';
    render(<ErrorAlert error={error} />);
    expect(screen.getByText('CustomError')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders "Error" as title when error is a string', () => {
    render(<ErrorAlert error="A string error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('A string error')).toBeInTheDocument();
  });

  it('passes additional alert props like data-testid', () => {
    render(<ErrorAlert error={new Error('Test')} data-testid="my-alert" />);
    expect(screen.getByTestId('my-alert')).toBeInTheDocument();
  });

  it('hides the alert after clicking close when isDismissable is true', () => {
    render(<ErrorAlert error={new Error('Dismissable error')} isDismissable />);
    expect(screen.getByText('Dismissable error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByText('Dismissable error')).not.toBeInTheDocument();
  });

  it('does not show a close button when isDismissable is false', () => {
    render(<ErrorAlert error={new Error('Non-dismissable')} isDismissable={false} />);
    expect(screen.queryByRole('button', {name: 'Close'})).not.toBeInTheDocument();
  });
});
