import {describe, expect, it} from 'vitest';
import {err, ok} from '../tools/helpers';

describe('ok()', () => {
  it('wraps a value as MCP text content', () => {
    const result = ok({id: '123', name: 'Test'});
    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse((result.content[0] as {type: 'text'; text: string}).text);
    expect(parsed).toEqual({id: '123', name: 'Test'});
  });

  it('handles null values', () => {
    const result = ok(null);
    expect((result.content[0] as {type: 'text'; text: string}).text).toBe('null');
  });

  it('handles arrays', () => {
    const result = ok([1, 2, 3]);
    const parsed = JSON.parse((result.content[0] as {type: 'text'; text: string}).text);
    expect(parsed).toEqual([1, 2, 3]);
  });
});

describe('err()', () => {
  it('wraps an Error as MCP error content', () => {
    const result = err(new Error('something went wrong'));
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect((result.content[0] as {type: 'text'; text: string}).text).toContain('something went wrong');
  });

  it('wraps a string error', () => {
    const result = err('bad request');
    expect(result.isError).toBe(true);
    expect((result.content[0] as {type: 'text'; text: string}).text).toContain('bad request');
  });

  it('wraps an unknown object', () => {
    const result = err({code: 404});
    expect(result.isError).toBe(true);
    expect((result.content[0] as {type: 'text'; text: string}).text).toContain('Error:');
  });
});
