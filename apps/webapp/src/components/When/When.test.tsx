import {render} from '@testing-library/react';

import {When} from './When.component';

describe('Show component', () => {
  it('renders children when `when` is true', () => {
    const {getByText} = render(
      <When when={true}>
        <div>Visible Content</div>
      </When>,
    );

    expect(getByText('Visible Content')).toBeInTheDocument();
  });

  it('renders fallback when `when` is false', () => {
    const {getByText} = render(
      <When when={false} fallback={<div>Fallback Content</div>}>
        <div>Visible Content</div>
      </When>,
    );

    expect(getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders nothing when `when` is false and no fallback is provided', () => {
    const {container} = render(
      <When when={false}>
        <div>Visible Content</div>
      </When>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders fallback when `when` is null', () => {
    const {getByText} = render(
      <When when={null} fallback={<div>Fallback Content</div>}>
        <div>Visible Content</div>
      </When>,
    );

    expect(getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders fallback when `when` is undefined', () => {
    const {getByText} = render(
      <When when={undefined} fallback={<div>Fallback Content</div>}>
        <div>Visible Content</div>
      </When>,
    );

    expect(getByText('Fallback Content')).toBeInTheDocument();
  });

  it('renders children when `when` is a non-false value', () => {
    const {getByText} = render(
      <When when={1}>
        <div>Visible Content</div>
      </When>,
    );

    expect(getByText('Visible Content')).toBeInTheDocument();
  });
});
