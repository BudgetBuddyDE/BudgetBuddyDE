import {describe, expect, it} from 'vitest';
import {cn} from './cn';

describe('cn', () => {
  it('combines conditional classes and resolves Tailwind conflicts', () => {
    const visible = false;
    expect(cn('px-2', visible ? 'hidden' : undefined, 'px-4')).toBe('px-4');
  });
});
