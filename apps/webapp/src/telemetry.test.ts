import {createLogger} from '@budgetbuddyde/logger';

it('redacts credentials from messages, errors, and nested metadata', () => {
  const source = {password: 'hidden', nested: {detail: 'token=private'}, userId: 'user-1'};
  let event: import('@budgetbuddyde/logger').LogEvent | undefined;
  createLogger({sinks: [value => (event = value)]}).error(new Error('Authorization: Bearer secret'), source);

  expect(event?.message).not.toContain('secret');
  expect(event?.error?.message).not.toContain('secret');
  expect(event).toMatchObject({password: '[REDACTED]', nested: {detail: 'token=[REDACTED]'}, userId: 'user-1'});
  expect(source.password).toBe('hidden');
});
