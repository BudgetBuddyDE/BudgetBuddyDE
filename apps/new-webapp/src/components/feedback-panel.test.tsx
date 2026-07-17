import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {FeedbackPanel} from './feedback-panel';

describe('FeedbackPanel', () => {
  it.each([
    ['loading', 'Loading transactions', 'status'],
    ['error', 'Transactions unavailable', 'alert'],
    ['empty', 'No transactions', null],
    ['success', 'Transaction saved', null],
  ] as const)('renders the %s state with accessible semantics', (kind, title, role) => {
    render(<FeedbackPanel kind={kind} title={title} description="Details" action={<button>Retry</button>} />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Retry'})).toBeInTheDocument();
    if (role) expect(screen.getByRole(role)).toBeInTheDocument();
  });
});
