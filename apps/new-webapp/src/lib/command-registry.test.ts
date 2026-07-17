import {describe, expect, it} from 'vitest';
import {availableCommands, commandRegistry, resolveTypedIntent} from './command-registry';

describe('command registry', () => {
  it.each(commandRegistry)('$id has availability and an executable destination', command => {
    expect(availableCommands({pathname: '/unrelated'}, command.label)).toContain(command);
    const href = typeof command.href === 'function' ? command.href('query') : command.href;
    expect(href).toMatch(/^\//);
    if (command.id.startsWith('navigate-') && typeof command.href === 'string')
      expect(availableCommands({pathname: command.href}, '')).not.toContain(command);
  });
  it('resolves object search, month report, and year report intents', () => {
    expect(resolveTypedIntent('transactions grocery', {pathname: '/dashboard'})?.href).toBe(
      '/transactions?search=grocery',
    );
    expect(resolveTypedIntent('report 2026-07', {pathname: '/dashboard'})?.href).toBe('/analytics?period=2026-07');
    expect(resolveTypedIntent('report 2026', {pathname: '/dashboard'})?.href).toBe('/reports?year=2026');
  });
  it('resolves create, edit, settings, and attachment intents for core objects', () => {
    expect(resolveTypedIntent('Create payment method', {pathname: '/dashboard'})?.href).toBe(
      '/payment-methods?intent=create',
    );
    expect(resolveTypedIntent('edit recurring payment Internet', {pathname: '/dashboard'})?.href).toBe(
      '/recurring-payments?search=Internet&intent=edit&object=Internet',
    );
    expect(resolveTypedIntent('Add attachment to transaction', {pathname: '/dashboard'})?.href).toBe(
      '/transactions?intent=attach',
    );
    expect(resolveTypedIntent('Manage sessions', {pathname: '/dashboard'})?.href).toBe('/settings/sessions');
  });
  it('returns no command for an unavailable or unknown intent', () => {
    expect(resolveTypedIntent('not a real command', {pathname: '/dashboard'})).toBeNull();
  });
});
