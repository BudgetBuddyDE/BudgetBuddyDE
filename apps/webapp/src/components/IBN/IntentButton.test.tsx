import {render, screen} from '@testing-library/react';
import type {AnchorHTMLAttributes, PropsWithChildren} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {IntentButton} from './IntentButton';

vi.mock('next/link', () => ({
  default: ({href, children, ...props}: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

describe('IntentButton', () => {
  it('renders a link for a transaction create intent', () => {
    render(<IntentButton intent={{entity: 'transaction', action: 'create'}}>Create Transaction</IntentButton>);

    expect(screen.getByRole('link', {name: 'Create Transaction'})).toHaveAttribute(
      'href',
      '/transactions?ibnEntity=transaction&ibnAction=create',
    );
  });
});
