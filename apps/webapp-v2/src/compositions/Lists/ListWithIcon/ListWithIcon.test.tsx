import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {ListWithIcon} from './ListWithIcon';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

describe('ListWithIcon', () => {
  it('renders icon, title, string subtitle and a German currency amount', () => {
    render(<ListWithIcon icon={<span>€</span>} title="OpenAI" subtitle="Subscription" amount={-23} />, {
      wrapper: TestProvider,
    });

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText(text => text.replace(/\s/g, '') === '-23,00€')).toBeInTheDocument();
  });

  it('renders array subtitles as outlined label chips and React content directly', () => {
    const {rerender} = render(<ListWithIcon title="Uber Eats" subtitle={['04.10', 'Food']} />, {wrapper: TestProvider});

    expect(screen.getByText('04.10').tagName).toBe('SPAN');
    expect(screen.getByText('Food')).toBeInTheDocument();

    rerender(<ListWithIcon title="Train" subtitle={<strong>Transport</strong>} />);
    expect(screen.getByText('Transport').tagName).toBe('STRONG');
  });

  it('renders a semantic button and calls the optional click handler', () => {
    const onClick = vi.fn();
    render(<ListWithIcon title="AWS" onClick={onClick} />, {wrapper: TestProvider});

    fireEvent.click(screen.getByRole('button', {name: 'AWS'}));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders an image when imageUrl is provided', () => {
    render(<ListWithIcon title="Merchant" imageUrl="/merchant.png" />, {wrapper: TestProvider});

    expect(document.querySelector('img')).toHaveAttribute('src', '/merchant.png');
  });
});
