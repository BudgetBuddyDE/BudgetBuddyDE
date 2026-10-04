import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import {createRef} from 'react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {Card} from './Card';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

describe('Card', () => {
  it('composes header, body and footer with interactive header actions', () => {
    const onClick = vi.fn();
    render(
      <Card>
        <Card.Header>
          <div>
            <Card.Title>Transactions</Card.Title>
            <Card.Subtitle>Recent activity</Card.Subtitle>
          </div>
          <Card.HeaderActions>
            <button type="button" onClick={onClick}>
              Add transaction
            </button>
          </Card.HeaderActions>
        </Card.Header>
        <Card.Body>Transaction list</Card.Body>
        <Card.Footer>Pagination</Card.Footer>
      </Card>,
      {wrapper: TestProvider},
    );

    expect(screen.getByRole('heading', {name: 'Transactions', level: 3})).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByText('Transaction list')).toBeInTheDocument();
    expect(screen.getByText('Pagination')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Add transaction'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports cards with free children and without named sections', () => {
    render(<Card>Custom content</Card>, {wrapper: TestProvider});

    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.queryByText('First section')).not.toBeInTheDocument();
  });

  it('forwards root HTML props, styles, styles API and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card
        ref={ref}
        id="transaction-card"
        aria-label="Transaction overview"
        className="custom-card"
        classNames={{root: 'root-style', section: 'section-style'}}
        style={{color: 'red'}}
        styles={{root: {backgroundColor: 'blue'}, section: {fontWeight: 700}}}
        padding="xl"
        withBorder
      >
        <Card.Body>Overview</Card.Body>
      </Card>,
      {wrapper: TestProvider},
    );

    const root = screen.getByLabelText('Transaction overview');
    const body = screen.getByText('Overview');
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'transaction-card');
    expect(root).toHaveClass('custom-card', 'root-style');
    expect(root).toHaveStyle({color: 'red', backgroundColor: 'blue'});
    expect(root.style.getPropertyValue('--card-padding')).toBe('var(--mantine-spacing-xl)');
    expect(root).toHaveAttribute('data-with-border');
    expect(body).toHaveClass('section-style');
    expect(body).toHaveStyle({fontWeight: '700'});
  });

  it('forwards named section refs, HTML props and style overrides', () => {
    const headerRef = createRef<HTMLDivElement>();
    const bodyRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();
    render(
      <Card>
        <Card.Header ref={headerRef} id="card-header" style={{color: 'red'}} withBorder>
          Header
        </Card.Header>
        <Card.Body ref={bodyRef} id="card-body" inheritPadding={false} className="custom-body">
          Body
        </Card.Body>
        <Card.Footer ref={footerRef} id="card-footer" styles={{section: {color: 'blue'}}} withBorder>
          Footer
        </Card.Footer>
      </Card>,
      {wrapper: TestProvider},
    );

    expect(headerRef.current).toBe(screen.getByText('Header'));
    expect(bodyRef.current).toBe(screen.getByText('Body'));
    expect(footerRef.current).toBe(screen.getByText('Footer'));
    expect(headerRef.current).toHaveAttribute('id', 'card-header');
    expect(headerRef.current).toHaveAttribute('data-inherit-padding');
    expect(headerRef.current).toHaveAttribute('data-with-border');
    expect(headerRef.current).toHaveStyle({color: 'red'});
    expect(bodyRef.current).toHaveAttribute('id', 'card-body');
    expect(bodyRef.current).not.toHaveAttribute('data-inherit-padding');
    expect(bodyRef.current).not.toHaveAttribute('data-with-border');
    expect(bodyRef.current).toHaveClass('custom-body');
    expect(footerRef.current).toHaveAttribute('id', 'card-footer');
    expect(footerRef.current).toHaveAttribute('data-inherit-padding');
    expect(footerRef.current).toHaveAttribute('data-with-border');
    expect(footerRef.current).toHaveStyle({color: 'blue'});
  });

  it('supports polymorphic root and named section elements with matching refs', () => {
    const rootRef = createRef<HTMLAnchorElement>();
    const headerRef = createRef<HTMLAnchorElement>();
    const bodyRef = createRef<HTMLAnchorElement>();
    const footerRef = createRef<HTMLAnchorElement>();
    render(
      <>
        <Card component="a" href="/transactions" ref={rootRef}>
          Open transactions
        </Card>
        <Card>
          <Card.Header component="a" href="/header" ref={headerRef}>
            Header link
          </Card.Header>
          <Card.Body component="a" href="/body" ref={bodyRef}>
            Body link
          </Card.Body>
          <Card.Footer component="a" href="/footer" ref={footerRef}>
            Footer link
          </Card.Footer>
        </Card>
      </>,
      {wrapper: TestProvider},
    );

    expect(rootRef.current).toBe(screen.getByRole('link', {name: 'Open transactions'}));
    expect(rootRef.current).toHaveAttribute('href', '/transactions');
    for (const [name, ref, href] of [
      ['Header link', headerRef, '/header'],
      ['Body link', bodyRef, '/body'],
      ['Footer link', footerRef, '/footer'],
    ] as const) {
      expect(ref.current).toBe(screen.getByRole('link', {name}));
      expect(ref.current).toHaveAttribute('href', href);
    }
  });

  it('supports a custom root renderer', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card ref={ref} aria-label="Custom overview" renderRoot={props => <div {...props} data-custom-root="true" />}>
        <Card.Body>Custom root body</Card.Body>
      </Card>,
      {wrapper: TestProvider},
    );

    expect(ref.current).toBe(screen.getByLabelText('Custom overview'));
    expect(ref.current).toHaveAttribute('data-custom-root', 'true');
    expect(screen.getByText('Custom root body')).toHaveAttribute('data-first-section');
    expect(screen.getByText('Custom root body')).toHaveAttribute('data-last-section');
  });

  it('forwards helper refs and allows typography and action layout overrides', () => {
    const actionsRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const subtitleRef = createRef<HTMLParagraphElement>();
    render(
      <Card>
        <Card.Header>
          <Card.Title ref={titleRef} order={2} size="xl" className="custom-title">
            Custom title
          </Card.Title>
          <Card.Subtitle ref={subtitleRef} size="lg" c="red" id="custom-subtitle">
            Custom subtitle
          </Card.Subtitle>
          <Card.HeaderActions ref={actionsRef} wrap="wrap" gap="lg" aria-label="Card actions">
            Actions
          </Card.HeaderActions>
        </Card.Header>
      </Card>,
      {wrapper: TestProvider},
    );

    expect(titleRef.current).toBe(screen.getByRole('heading', {name: 'Custom title', level: 2}));
    expect(titleRef.current).toHaveClass('custom-title');
    expect(subtitleRef.current).toBe(screen.getByText('Custom subtitle'));
    expect(subtitleRef.current).toHaveAttribute('id', 'custom-subtitle');
    expect(actionsRef.current).toBe(screen.getByLabelText('Card actions'));
    expect(actionsRef.current?.style.getPropertyValue('--group-wrap')).toBe('wrap');
    expect(actionsRef.current?.style.getPropertyValue('--group-gap')).toBe('var(--mantine-spacing-lg)');
  });

  it.each(['vertical', 'horizontal'] as const)(
    'updates section boundaries when optional sections change in %s cards',
    orientation => {
      function OptionalSections({withHeader, withFooter}: {withHeader: boolean; withFooter: boolean}) {
        return (
          <Card orientation={orientation}>
            {withHeader && <Card.Header>Header</Card.Header>}
            <Card.Body>Body</Card.Body>
            {withFooter && <Card.Footer>Footer</Card.Footer>}
          </Card>
        );
      }

      const {rerender} = render(<OptionalSections withHeader withFooter />, {wrapper: TestProvider});

      expect(screen.getByText('Header')).toHaveAttribute('data-first-section');
      expect(screen.getByText('Header')).not.toHaveAttribute('data-last-section');
      expect(screen.getByText('Body')).not.toHaveAttribute('data-first-section');
      expect(screen.getByText('Body')).not.toHaveAttribute('data-last-section');
      expect(screen.getByText('Footer')).toHaveAttribute('data-last-section');
      for (const name of ['Header', 'Body', 'Footer']) {
        expect(screen.getByText(name)).toHaveAttribute('data-orientation', orientation);
      }

      rerender(<OptionalSections withHeader={false} withFooter />);
      expect(screen.queryByText('Header')).not.toBeInTheDocument();
      expect(screen.getByText('Body')).toHaveAttribute('data-first-section');
      expect(screen.getByText('Body')).not.toHaveAttribute('data-last-section');
      expect(screen.getByText('Footer')).toHaveAttribute('data-last-section');

      rerender(<OptionalSections withHeader={false} withFooter={false} />);
      expect(screen.queryByText('Footer')).not.toBeInTheDocument();
      expect(screen.getByText('Body')).toHaveAttribute('data-first-section');
      expect(screen.getByText('Body')).toHaveAttribute('data-last-section');
      expect(screen.getByText('Body')).toHaveAttribute('data-orientation', orientation);
    },
  );

  it('keeps native Section behavior and accounts for free children at card edges', () => {
    render(
      <Card orientation="horizontal">
        <p>Leading content</p>
        <Card.Header>Header</Card.Header>
        <Card.Section withBorder>Native section</Card.Section>
        <Card.Footer>Footer</Card.Footer>
        <p>Trailing content</p>
      </Card>,
      {wrapper: TestProvider},
    );

    for (const name of ['Header', 'Native section', 'Footer']) {
      expect(screen.getByText(name)).toHaveAttribute('data-orientation', 'horizontal');
      expect(screen.getByText(name)).not.toHaveAttribute('data-first-section');
      expect(screen.getByText(name)).not.toHaveAttribute('data-last-section');
    }
    expect(screen.getByText('Native section')).toHaveAttribute('data-with-border');
    expect(screen.getByText('Native section')).not.toHaveAttribute('data-inherit-padding');
  });
});
