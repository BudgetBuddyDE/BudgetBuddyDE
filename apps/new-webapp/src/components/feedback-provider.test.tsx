import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {FeedbackProvider, useFeedback} from './feedback-provider';

function Harness() {
  const {showToast} = useFeedback();
  return (
    <>
      <button onClick={() => showToast({message: 'Saved', tone: 'success', duration: 0})}>Success</button>
      <button onClick={() => showToast({message: 'Failed', tone: 'error', duration: 0})}>Error</button>
    </>
  );
}

describe('FeedbackProvider', () => {
  it('stacks all global toasts in one dismissible accessible viewport', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <Harness />
      </FeedbackProvider>,
    );
    await user.click(screen.getByRole('button', {name: 'Success'}));
    await user.click(screen.getByRole('button', {name: 'Error'}));

    const viewport = screen.getByLabelText('Notifications');
    expect(viewport).toHaveClass('toast-viewport');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getAllByRole('button', {name: 'Dismiss notification'})).toHaveLength(2);

    await user.click(screen.getAllByRole('button', {name: 'Dismiss notification'})[0]!);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeVisible();
  });
});
