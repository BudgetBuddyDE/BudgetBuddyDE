import {fireEvent, render} from '@testing-library/react';
import React from 'react';

import {useKeyPress} from './useKeyPress.hook';

const TestComponent: React.FC<{
  keys: string[];
  callback: (event: KeyboardEvent) => void;
  node?: HTMLElement | Document | null;
  requireCtrl?: boolean;
}> = ({keys, callback, node = null, requireCtrl = false}) => {
  useKeyPress(keys, callback, node, requireCtrl);
  return <div tabIndex={0}>Test Component</div>;
};

describe('useKeyPress', () => {
  it('calls the callback when the specified key is pressed', () => {
    const callback = vi.fn();
    const {getByText} = render(<TestComponent keys={['a']} callback={callback} />);
    const div = getByText('Test Component');

    div.focus();
    fireEvent.keyDown(div, {key: 'a'});

    expect(callback).toHaveBeenCalled();
  });

  it('does not call the callback when an unspecified key is pressed', () => {
    const callback = vi.fn();
    const {getByText} = render(<TestComponent keys={['a']} callback={callback} />);
    const div = getByText('Test Component');

    div.focus();
    fireEvent.keyDown(div, {key: 'b'});

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls the callback when the specified key and ctrl are pressed if requireCtrl is true', () => {
    const callback = vi.fn();
    const {getByText} = render(<TestComponent keys={['a']} callback={callback} requireCtrl />);
    const div = getByText('Test Component');

    div.focus();
    fireEvent.keyDown(div, {key: 'a', ctrlKey: true});

    expect(callback).toHaveBeenCalled();
  });

  it('does not call the callback when the specified key is pressed without ctrl if requireCtrl is true', () => {
    const callback = vi.fn();
    const {getByText} = render(<TestComponent keys={['a']} callback={callback} requireCtrl />);
    const div = getByText('Test Component');

    div.focus();
    fireEvent.keyDown(div, {key: 'a', ctrlKey: false});

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls the callback for multiple specified keys', () => {
    const callback = vi.fn();
    const {getByText} = render(<TestComponent keys={['a', 'b']} callback={callback} />);
    const div = getByText('Test Component');

    div.focus();
    fireEvent.keyDown(div, {key: 'a'});
    fireEvent.keyDown(div, {key: 'b'});

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('works with a specified node other than document', () => {
    const callback = vi.fn();
    render(
      <div>
        <TestComponent keys={['a']} callback={callback} node={document.body} />
      </div>,
    );

    fireEvent.keyDown(document.body, {key: 'a'});

    expect(callback).toHaveBeenCalled();
  });
});
