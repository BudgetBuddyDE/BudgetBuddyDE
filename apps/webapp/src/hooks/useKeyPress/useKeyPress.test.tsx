import {fireEvent, render} from '@testing-library/react';
import type React from 'react';
import {describe, expect, it, vi} from 'vitest';

import {useKeyPress} from './useKeyPress';

const KeyPressHelper: React.FC<{
  keys: string[];
  callback: (event: KeyboardEvent) => void;
  node?: HTMLElement | Document | null;
  requireCtrl?: boolean;
}> = ({keys, callback, node = null, requireCtrl = false}) => {
  useKeyPress(keys, callback, node, requireCtrl);
  return <div>helper</div>;
};

describe('useKeyPress', () => {
  it('calls the callback when the specified key is pressed', () => {
    const callback = vi.fn();
    render(<KeyPressHelper keys={['a']} callback={callback} />);
    fireEvent.keyDown(document, {key: 'a'});
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call the callback for an unspecified key', () => {
    const callback = vi.fn();
    render(<KeyPressHelper keys={['a']} callback={callback} />);
    fireEvent.keyDown(document, {key: 'z'});
    expect(callback).not.toHaveBeenCalled();
  });

  it('calls the callback for multiple specified keys', () => {
    const callback = vi.fn();
    render(<KeyPressHelper keys={['a', 'b']} callback={callback} />);
    fireEvent.keyDown(document, {key: 'a'});
    fireEvent.keyDown(document, {key: 'b'});
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('requires ctrl key when requireCtrl is true', () => {
    const callback = vi.fn();
    render(<KeyPressHelper keys={['s']} callback={callback} requireCtrl />);
    fireEvent.keyDown(document, {key: 's', ctrlKey: false});
    expect(callback).not.toHaveBeenCalled();
    fireEvent.keyDown(document, {key: 's', ctrlKey: true});
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('attaches listener to a custom node', () => {
    const callback = vi.fn();
    render(<KeyPressHelper keys={['x']} callback={callback} node={document.body} />);
    fireEvent.keyDown(document.body, {key: 'x'});
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
