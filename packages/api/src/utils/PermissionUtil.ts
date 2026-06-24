import type {Entity, EntityAction, PermissionConfig} from '../types/auth';

export class PermissionUtil {
  public static hasPermissionFor(entity: Entity, action: EntityAction, permissions: PermissionConfig): boolean {
    const entityPermissions = permissions[entity] ?? [];

    return entityPermissions.includes('write') || (action === 'read' && entityPermissions.includes('read'));
  }
}
