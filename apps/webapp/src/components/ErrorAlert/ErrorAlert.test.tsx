import {render, screen} from '@testing-library/react';

import {ErrorAlert as ErrorComp} from './ErrorAlert';

describe('Error Component', () => {
  it('renders nothing when error is null', () => {
    const {container} = render(<ErrorComp error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when error is undefined', () => {
    const {container} = render(<ErrorComp error={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders error message when error is provided', () => {
    const error = new Error('Test Error Message');
    error.name = 'Test Error Name';
    render(<ErrorComp error={error} />);
    expect(screen.getByText(error.name)).toBeInTheDocument();
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('passes additional alert props to the Alert component', () => {
    render(<ErrorComp error={new Error('Test Error')} data-testid="error-alert" />);
    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
  });

  it('closes the alert when the close button is clicked', () => {
    const {rerender} = render(<ErrorComp error={new Error('Test Error')} />);
    const closeButton = screen.getByRole('button', {name: 'Close'});
    closeButton.click();
    rerender(<ErrorComp error={null} />);
    expect(screen.queryByText('Test Error')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Close'})).not.toBeInTheDocument();
  });
});
