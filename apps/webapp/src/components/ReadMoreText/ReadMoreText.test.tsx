import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {ReadMoreText} from './ReadMoreText';

const longText = 'a'.repeat(200);

describe('ReadMoreText', () => {
  it('truncates text beyond maxLength and shows "Read more"', () => {
    render(<ReadMoreText text={longText} maxLength={100} />);
    expect(screen.getByText(/Read more/)).toBeInTheDocument();
    expect(screen.queryByText(longText)).not.toBeInTheDocument();
  });

  it('expands text when "Read more" is clicked', () => {
    render(<ReadMoreText text={longText} maxLength={100} />);
    fireEvent.click(screen.getByText('Read more'));
    expect(screen.getByText(longText)).toBeInTheDocument();
    expect(screen.getByText('Read less')).toBeInTheDocument();
  });

  it('collapses text again when "Read less" is clicked', () => {
    render(<ReadMoreText text={longText} maxLength={100} />);
    fireEvent.click(screen.getByText('Read more'));
    fireEvent.click(screen.getByText('Read less'));
    expect(screen.getByText('Read more')).toBeInTheDocument();
    expect(screen.queryByText(longText)).not.toBeInTheDocument();
  });

  it('uses custom labels when provided', () => {
    render(<ReadMoreText text={longText} maxLength={10} labels={{readMore: 'Show all', readLess: 'Collapse'}} />);
    expect(screen.getByText('Show all')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show all'));
    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });

  it('shows full text when text length is within maxLength', () => {
    render(<ReadMoreText text="Short text" maxLength={100} />);
    // Still renders the toggle link, but full text is shown from the start
    expect(screen.getByText(/Short text/)).toBeInTheDocument();
  });
});
