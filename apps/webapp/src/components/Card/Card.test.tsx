import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import Card from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <span>Card content</span>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('Card.Title renders bold typography', () => {
    render(<Card.Title>My Title</Card.Title>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('Card.Subtitle renders secondary typography', () => {
    render(<Card.Subtitle>My Subtitle</Card.Subtitle>);
    expect(screen.getByText('My Subtitle')).toBeInTheDocument();
  });

  it('Card.Header renders children', () => {
    render(
      <Card.Header>
        <span>Header child</span>
      </Card.Header>,
    );
    expect(screen.getByText('Header child')).toBeInTheDocument();
  });

  it('Card.Body renders children', () => {
    render(
      <Card.Body>
        <p>Body text</p>
      </Card.Body>,
    );
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('Card.Footer renders children', () => {
    render(
      <Card.Footer>
        <p>Footer text</p>
      </Card.Footer>,
    );
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('Card.HeaderActions renders children inside ActionPaper', () => {
    render(
      <Card.HeaderActions>
        <button type="button">Action</button>
      </Card.HeaderActions>,
    );
    expect(screen.getByRole('button', {name: 'Action'})).toBeInTheDocument();
  });

  it('renders a full card layout', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Title</Card.Title>
          <Card.Subtitle>Subtitle</Card.Subtitle>
        </Card.Header>
        <Card.Body>
          <p>Body</p>
        </Card.Body>
        <Card.Footer>
          <p>Footer</p>
        </Card.Footer>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
