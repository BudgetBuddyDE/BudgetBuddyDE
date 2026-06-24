import {PermissionUtil} from './PermissionUtil';

describe('PermissionUtil', () => {
  describe('hasPermissionFor', () => {
    it.each(['create', 'read', 'update', 'delete'] as const)(
      'allows %s when the entity has write permission',
      action => {
        expect(PermissionUtil.hasPermissionFor('transaction', action, {transaction: ['write']})).toBe(true);
      },
    );

    it('allows read when the entity has read permission', () => {
      expect(PermissionUtil.hasPermissionFor('transaction', 'read', {transaction: ['read']})).toBe(true);
    });

    it.each(['create', 'update', 'delete'] as const)('denies %s when the entity only has read permission', action => {
      expect(PermissionUtil.hasPermissionFor('transaction', action, {transaction: ['read']})).toBe(false);
    });

    it('denies access when permissions only exist for another entity', () => {
      expect(PermissionUtil.hasPermissionFor('transaction', 'read', {budget: ['write']})).toBe(false);
    });

    it('denies access when no permissions are configured', () => {
      expect(PermissionUtil.hasPermissionFor('transaction', 'read', {})).toBe(false);
    });
  });
});
