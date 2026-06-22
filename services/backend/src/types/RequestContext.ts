import type {PermissionConfig} from '@budgetbuddyde/api/auth';
import type {Session as AuthSession, User as AuthUser} from 'better-auth';

export interface RequestContext<User = AuthUser, Session = AuthSession> {
  /**
   * @deprecated Not used — request tracing has been removed.
   * Correlation identifier generated per incoming request.
   */
  requestId?: string;
  /**
   * Authenticated user context if available, otherwise null.
   */
  user: User | null;
  /**
   * Authenticated session context if available, otherwise null.
   */
  session: Session | null;
  /**
   * Permissions configuration for the authenticated user.
   */
  permissions: PermissionConfig;
}
