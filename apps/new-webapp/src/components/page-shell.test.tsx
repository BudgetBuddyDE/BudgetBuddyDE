import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {PageShell} from './page-shell';

describe('PageShell', () => {
  it('composes heading, description, actions, and content', () => {
    render(
      <PageShell title="Transactions" description="Track money" actions={<button>Add</button>}>
        <p>Table</p>
      </PageShell>,
    );
    expect(screen.getByRole('heading', {name: 'Transactions'})).toBeInTheDocument();
    expect(screen.getByText('Track money')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Add'})).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });
});
